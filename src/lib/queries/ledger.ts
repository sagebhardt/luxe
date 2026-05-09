import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  clients,
  ledgerEntries,
  trips,
  users,
  type ledgerEntryKind,
} from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth";

export type LedgerKind = (typeof ledgerEntryKind.enumValues)[number];

/* All entries for a booking, newest first. Caller already verified
 * ownership of the booking via assertOwnsBooking. */
export async function listLedgerForBooking(bookingId: string) {
  return db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.bookingId, bookingId))
    .orderBy(desc(ledgerEntries.occurredOn), desc(ledgerEntries.createdAt));
}

export async function listLedgerForTrip(tripId: string) {
  return db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.tripId, tripId))
    .orderBy(desc(ledgerEntries.occurredOn), desc(ledgerEntries.createdAt));
}

export type LedgerSummary = {
  /** What clients have been invoiced minus what they've paid (still owed to us). */
  clientOutstanding: number;
  /** What we've committed to pay suppliers minus what we've paid. */
  supplierOutstanding: number;
  /** Commissions we've received from suppliers. */
  commissionsReceived: number;
  /** What we've paid out to ITDs. */
  itdPaidOut: number;
  /** Pending ITD payouts (recorded but not yet completed). */
  itdPending: number;
};

/**
 * Org-wide rollup for /admin/ledger. Sums by kind+status. All amounts
 * are summed in their original currency (no FX) — for cross-currency
 * agencies, breakdowns by currency would be the next step. For now
 * it's a fast org pulse.
 */
export async function getLedgerSummary(opts?: {
  itdUserId?: string;
}): Promise<LedgerSummary> {
  const itdFilter = opts?.itdUserId
    ? eq(ledgerEntries.itdUserId, opts.itdUserId)
    : undefined;

  const sumWhere = (
    kind: LedgerKind,
    status: "pending" | "completed",
  ) => {
    const conditions = [
      eq(ledgerEntries.kind, kind),
      eq(ledgerEntries.status, status),
    ];
    if (itdFilter) conditions.push(itdFilter);
    return db
      .select({
        total: sql<number>`coalesce(sum(${ledgerEntries.amount})::float, 0)`,
      })
      .from(ledgerEntries)
      .where(and(...conditions))
      .then((r) => Number(r[0]?.total ?? 0));
  };

  const [
    invoiced,
    received,
    supplierCommitted,
    supplierPaid,
    commissions,
    itdPaid,
    itdPending,
  ] = await Promise.all([
    sumWhere("client_invoice", "completed"),
    sumWhere("client_payment", "completed"),
    sumWhere("supplier_payment", "pending"),
    sumWhere("supplier_payment", "completed"),
    sumWhere("commission_received", "completed"),
    sumWhere("itd_payout", "completed"),
    sumWhere("itd_payout", "pending"),
  ]);

  return {
    clientOutstanding: invoiced - received,
    supplierOutstanding: supplierCommitted - supplierPaid,
    commissionsReceived: commissions,
    itdPaidOut: itdPaid,
    itdPending,
  };
}

/**
 * Per-ITD breakdown for the admin /ledger view. Lists every ITD with
 * their pending vs paid commission totals (just kind=itd_payout summed).
 */
export async function listItdLedgerStats() {
  const rows = await db
    .select({
      itdUserId: ledgerEntries.itdUserId,
      itdName: users.name,
      itdEmail: users.email,
      kind: ledgerEntries.kind,
      status: ledgerEntries.status,
      total: sql<number>`coalesce(sum(${ledgerEntries.amount})::float, 0)`,
    })
    .from(ledgerEntries)
    .leftJoin(users, eq(users.id, ledgerEntries.itdUserId))
    .where(eq(ledgerEntries.kind, "itd_payout"))
    .groupBy(
      ledgerEntries.itdUserId,
      users.name,
      users.email,
      ledgerEntries.kind,
      ledgerEntries.status,
    );

  type Bucket = {
    itdUserId: string | null;
    name: string | null;
    email: string | null;
    pending: number;
    paid: number;
  };
  const map = new Map<string, Bucket>();
  for (const r of rows) {
    if (!r.itdUserId) continue;
    const key = r.itdUserId;
    if (!map.has(key)) {
      map.set(key, {
        itdUserId: r.itdUserId,
        name: r.itdName,
        email: r.itdEmail,
        pending: 0,
        paid: 0,
      });
    }
    const b = map.get(key)!;
    if (r.status === "pending") b.pending = Number(r.total);
    if (r.status === "completed") b.paid = Number(r.total);
  }
  return Array.from(map.values()).sort((a, b) => b.pending - a.pending);
}

/**
 * Recent entries for the admin /ledger feed. Joins through to client
 * and trip names so the table can show context without N+1.
 */
export async function listRecentLedgerEntries(viewer: Viewer, limit = 50) {
  const conditions = [];
  if (viewer.role !== "admin") {
    /* ITDs see only entries on their own trips/bookings, plus their
     * own payouts. */
    conditions.push(
      sql`(${clients.ownerId} = ${viewer.id} OR ${ledgerEntries.itdUserId} = ${viewer.id})`,
    );
  }
  return db
    .select({
      id: ledgerEntries.id,
      kind: ledgerEntries.kind,
      amount: ledgerEntries.amount,
      currency: ledgerEntries.currency,
      reference: ledgerEntries.reference,
      status: ledgerEntries.status,
      occurredOn: ledgerEntries.occurredOn,
      notes: ledgerEntries.notes,
      bookingId: ledgerEntries.bookingId,
      tripId: ledgerEntries.tripId,
      tripName: trips.name,
      clientName: clients.name,
      itdName: users.name,
    })
    .from(ledgerEntries)
    .leftJoin(trips, eq(trips.id, ledgerEntries.tripId))
    .leftJoin(clients, eq(clients.id, trips.clientId))
    .leftJoin(users, eq(users.id, ledgerEntries.itdUserId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ledgerEntries.occurredOn), desc(ledgerEntries.createdAt))
    .limit(limit);
}
