import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings, bookings, trips } from "@/lib/db/schema";
import { getRate } from "@/lib/fx";

/**
 * Aggregate margin reports across all trips. Each booking is converted
 * twice: once into its trip's base_currency (using the locked FX rate
 * if present, today's otherwise), then into the org's reporting
 * currency at today's rate.
 *
 * The resulting numbers are estimates whenever any line is unlocked —
 * we surface that count so the UI can mark cells as estimated.
 */

export type ReportTotals = {
  reportingCurrency: string;
  sell: number;
  cost: number;
  margin: number;
  marginPct: number | null;
  tripCount: number;
  unlockedLines: number;
};

export type ReportGroup = ReportTotals & {
  /** Group key (destination name, "YYYY-MM", etc.). */
  key: string;
  label: string;
};

export type ReportSummary = {
  totals: ReportTotals;
  byDestination: ReportGroup[];
  byMonth: ReportGroup[];
};

async function getReportingCurrency(): Promise<string> {
  const [row] = await db
    .select({ ccy: appSettings.reportingCurrency })
    .from(appSettings)
    .limit(1);
  return row?.ccy ?? "USD";
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthKey(iso: string | null): { key: string; label: string } | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return {
    key: `${y}-${String(m + 1).padStart(2, "0")}`,
    label: `${MONTH_LABELS[m]} ${y}`,
  };
}

export async function getReportSummary(): Promise<ReportSummary> {
  const reportingCurrency = await getReportingCurrency();

  /* Pull every booking joined to its trip's destination + start date +
   * base currency. We do the FX math in JS — volumes are tiny (this
   * is a per-agency rollup). */
  const rows = await db
    .select({
      tripId: bookings.tripId,
      destination: trips.destination,
      startDate: trips.startDate,
      baseCurrency: trips.baseCurrency,
      sellAmount: bookings.sellAmount,
      costAmount: bookings.costAmount,
      costCurrency: bookings.costCurrency,
      costFxToBase: bookings.costFxToBase,
      costLocked: bookings.costLocked,
    })
    .from(bookings)
    .innerJoin(trips, eq(trips.id, bookings.tripId))
    .where(
      and(
        inArray(bookings.status, ["confirmed", "pending"]),
      ),
    );

  /* Cache cross rates so we hit `getRate` once per pair. */
  const rateCache = new Map<string, number>();
  const rateOf = async (from: string, to: string): Promise<number> => {
    if (from === to) return 1;
    const k = `${from}>${to}`;
    const cached = rateCache.get(k);
    if (cached != null) return cached;
    const r = await getRate(from, to);
    rateCache.set(k, r);
    return r;
  };

  type Bucket = {
    sell: number;
    cost: number;
    tripIds: Set<string>;
    unlockedLines: number;
  };
  const blank = (): Bucket => ({
    sell: 0,
    cost: 0,
    tripIds: new Set(),
    unlockedLines: 0,
  });

  const totals = blank();
  const byDest = new Map<string, Bucket & { label: string }>();
  const byMonth = new Map<string, Bucket & { label: string }>();

  for (const r of rows) {
    const baseToReporting = await rateOf(
      r.baseCurrency ?? "USD",
      reportingCurrency,
    );

    const sellInReport = r.sellAmount
      ? Number(r.sellAmount) * baseToReporting
      : 0;

    let costInReport = 0;
    let unlocked = 0;
    if (r.costAmount) {
      const ccy = r.costCurrency ?? r.baseCurrency ?? "USD";
      let costToBase: number;
      if (r.costLocked && r.costFxToBase) {
        costToBase = Number(r.costFxToBase);
      } else {
        unlocked = 1;
        costToBase = await rateOf(ccy, r.baseCurrency ?? "USD");
      }
      costInReport =
        Number(r.costAmount) * costToBase * baseToReporting;
    }

    totals.sell += sellInReport;
    totals.cost += costInReport;
    totals.tripIds.add(r.tripId);
    totals.unlockedLines += unlocked;

    const dest = r.destination?.trim() || "(unspecified)";
    if (!byDest.has(dest)) byDest.set(dest, { ...blank(), label: dest });
    const dBucket = byDest.get(dest)!;
    dBucket.sell += sellInReport;
    dBucket.cost += costInReport;
    dBucket.tripIds.add(r.tripId);
    dBucket.unlockedLines += unlocked;

    const month = monthKey(r.startDate);
    if (month) {
      if (!byMonth.has(month.key))
        byMonth.set(month.key, { ...blank(), label: month.label });
      const mBucket = byMonth.get(month.key)!;
      mBucket.sell += sellInReport;
      mBucket.cost += costInReport;
      mBucket.tripIds.add(r.tripId);
      mBucket.unlockedLines += unlocked;
    }
  }

  const finalize = (b: Bucket): ReportTotals => ({
    reportingCurrency,
    sell: b.sell,
    cost: b.cost,
    margin: b.sell - b.cost,
    marginPct: b.sell > 0 ? ((b.sell - b.cost) / b.sell) * 100 : null,
    tripCount: b.tripIds.size,
    unlockedLines: b.unlockedLines,
  });

  return {
    totals: finalize(totals),
    byDestination: Array.from(byDest.entries())
      .map(([key, b]) => ({ key, label: b.label, ...finalize(b) }))
      .sort((a, b) => b.sell - a.sell),
    byMonth: Array.from(byMonth.entries())
      .map(([key, b]) => ({ key, label: b.label, ...finalize(b) }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  };
}
