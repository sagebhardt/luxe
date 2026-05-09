import "server-only";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  clients,
  ledgerEntries,
  trips,
  users,
} from "@/lib/db/schema";

/**
 * Pull all ledger entries + supporting context for an ITD's monthly
 * statement. Bounded by [monthStart, nextMonthStart) — we use the
 * occurred_on date (not created_at) so the period reflects the actual
 * money movement.
 */

export type StatementLine = {
  id: string;
  kind: string;
  status: string;
  amount: string;
  currency: string;
  reference: string | null;
  occurredOn: string;
  notes: string | null;
  tripName: string | null;
  clientName: string | null;
  bookingTitle: string | null;
};

export async function getItdStatement(opts: {
  itdUserId: string;
  monthStart: string; // 'YYYY-MM-01'
  nextMonthStart: string; // 'YYYY-MM-01' (exclusive)
}) {
  const itd = await db.query.users.findFirst({
    where: eq(users.id, opts.itdUserId),
    columns: {
      id: true,
      name: true,
      email: true,
      commissionPctBase: true,
    },
  });
  if (!itd) return null;

  /* All payout entries to this ITD in the period. */
  const payouts: StatementLine[] = await db
    .select({
      id: ledgerEntries.id,
      kind: ledgerEntries.kind,
      status: ledgerEntries.status,
      amount: ledgerEntries.amount,
      currency: ledgerEntries.currency,
      reference: ledgerEntries.reference,
      occurredOn: ledgerEntries.occurredOn,
      notes: ledgerEntries.notes,
      tripName: trips.name,
      clientName: clients.name,
      bookingTitle: bookings.title,
    })
    .from(ledgerEntries)
    .leftJoin(trips, eq(trips.id, ledgerEntries.tripId))
    .leftJoin(clients, eq(clients.id, trips.clientId))
    .leftJoin(bookings, eq(bookings.id, ledgerEntries.bookingId))
    .where(
      and(
        eq(ledgerEntries.kind, "itd_payout"),
        eq(ledgerEntries.itdUserId, opts.itdUserId),
        gte(ledgerEntries.occurredOn, opts.monthStart),
        lt(ledgerEntries.occurredOn, opts.nextMonthStart),
      ),
    )
    .orderBy(asc(ledgerEntries.occurredOn));

  /* Trips this ITD owns where bookings were confirmed in the period.
   * Used for the "earned" view — what they ought to be paid based on
   * booking activity, separate from what's actually been recorded as
   * payouts. */
  const earningTrips = await db
    .select({
      tripId: trips.id,
      tripName: trips.name,
      clientName: clients.name,
      destination: trips.destination,
      bookingId: bookings.id,
      bookingTitle: bookings.title,
      sellAmount: bookings.sellAmount,
      sellCurrency: bookings.sellCurrency,
      costAmount: bookings.costAmount,
      costCurrency: bookings.costCurrency,
      costFxToBase: bookings.costFxToBase,
      sellFxToBase: bookings.sellFxToBase,
      costLocked: bookings.costLocked,
      baseCurrency: trips.baseCurrency,
      confirmedAt: bookings.confirmedAt,
    })
    .from(bookings)
    .innerJoin(trips, eq(trips.id, bookings.tripId))
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(
      and(
        eq(clients.ownerId, opts.itdUserId),
        gte(bookings.confirmedAt, new Date(opts.monthStart)),
        lt(bookings.confirmedAt, new Date(opts.nextMonthStart)),
      ),
    )
    .orderBy(asc(bookings.confirmedAt));

  /* Compute the ITD's earned share for each booking using their
   * commission tier. Per-currency totals are kept; FX conversion is
   * left to the caller (the PDF page). */
  const itdSharePct = Number(itd.commissionPctBase);
  type EarningRow = {
    tripName: string;
    clientName: string;
    destination: string;
    bookingTitle: string;
    sellAmount: number;
    sellCurrency: string;
    costAmount: number;
    costCurrency: string;
    margin: number;
    marginCurrency: string;
    itdShare: number;
  };
  const earnings: EarningRow[] = [];
  for (const row of earningTrips) {
    if (!row.sellAmount || !row.costAmount) continue;
    const baseCcy = row.baseCurrency ?? "USD";
    const sellCcy = row.sellCurrency ?? baseCcy;
    const costCcy = row.costCurrency ?? baseCcy;
    /* Convert into the trip's base currency to compute margin. Use
     * locked rate when available, else 1 (we don't fetch FX here —
     * the PDF page handles cross-currency display). */
    const sellInBase =
      sellCcy === baseCcy
        ? Number(row.sellAmount)
        : Number(row.sellAmount) * Number(row.sellFxToBase ?? 1);
    const costInBase =
      costCcy === baseCcy
        ? Number(row.costAmount)
        : Number(row.costAmount) * Number(row.costFxToBase ?? 1);
    const margin = sellInBase - costInBase;
    earnings.push({
      tripName: row.tripName,
      clientName: row.clientName ?? "—",
      destination: row.destination,
      bookingTitle: row.bookingTitle,
      sellAmount: Number(row.sellAmount),
      sellCurrency: sellCcy,
      costAmount: Number(row.costAmount),
      costCurrency: costCcy,
      margin,
      marginCurrency: baseCcy,
      itdShare: margin * itdSharePct,
    });
  }

  return {
    itd: {
      id: itd.id,
      name: itd.name,
      email: itd.email,
      commissionPctBase: itdSharePct,
    },
    payouts,
    earnings,
  };
}
