import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { fxRates } from "./db/schema";

/**
 * FX rate service. Uses open.er-api.com (no key, USD-anchored daily
 * rates) and caches into fx_rates. On miss, falls back to the most
 * recent stored rate for the pair so a flaky upstream doesn't break
 * locking a booking.
 */

const SOURCE_URL = "https://open.er-api.com/v6/latest/USD";

type SourceResponse = {
  result: "success" | "error";
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc?: string;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Find a stored rate for from→to on or before `asOf`. Returns null if
 * none cached yet. Use for the stale-fallback path. */
async function readStoredRate(
  from: string,
  to: string,
  asOf: string,
): Promise<number | null> {
  const [row] = await db
    .select({ rate: fxRates.rate, asOf: fxRates.asOf })
    .from(fxRates)
    .where(
      and(
        eq(fxRates.fromCurrency, from),
        eq(fxRates.toCurrency, to),
      ),
    )
    .orderBy(desc(fxRates.asOf))
    .limit(1);
  if (!row) return null;
  if (row.asOf > asOf) return null;
  return Number(row.rate);
}

async function fetchAndCache(asOf: string): Promise<Map<string, number>> {
  const res = await fetch(SOURCE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`fx fetch failed: ${res.status}`);
  const json = (await res.json()) as SourceResponse;
  if (json.result !== "success") throw new Error("fx api returned error");

  const rates = new Map<string, number>(Object.entries(json.rates));
  /* Store every rate as USD→XXX for the day. We derive cross rates
   * via USD on lookup, so we don't need to write XXX→YYY explicitly. */
  const rows = Array.from(rates.entries()).map(([currency, rate]) => ({
    fromCurrency: "USD",
    toCurrency: currency,
    rate: rate.toString(),
    asOf,
  }));
  if (rows.length) {
    await db
      .insert(fxRates)
      .values(rows)
      .onConflictDoNothing();
  }
  return rates;
}

/** Convert `amount` from `from` to `to` using cached daily rates.
 * Returns the converted amount (same fractional precision). */
export async function convert(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return amount;
  const rate = await getRate(from, to);
  return amount * rate;
}

/** Get the from→to rate. Uses today's USD-anchored snapshot, derives
 * cross rates through USD if needed. Falls back to most recent stored
 * snapshot on upstream failure. */
export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const asOf = todayISO();

  /* Fast path: already cached for today. */
  const usdToFrom = await readStoredRate("USD", from, asOf);
  const usdToTo = await readStoredRate("USD", to, asOf);
  if (usdToFrom != null && usdToTo != null) {
    return usdToTo / usdToFrom;
  }

  /* Refetch and cache. */
  try {
    const rates = await fetchAndCache(asOf);
    const a = from === "USD" ? 1 : rates.get(from);
    const b = to === "USD" ? 1 : rates.get(to);
    if (a == null || b == null) {
      throw new Error(`fx unsupported pair: ${from}→${to}`);
    }
    return b / a;
  } catch (err) {
    /* Stale fallback: any prior snapshot, however old, beats failing
     * the action. The stored rate becomes the locked rate, so a one-day
     * drift won't follow the booking through history. */
    const a = from === "USD" ? 1 : await readStoredRate("USD", from, "9999-12-31");
    const b = to === "USD" ? 1 : await readStoredRate("USD", to, "9999-12-31");
    if (a == null || b == null) throw err;
    return b / a;
  }
}
