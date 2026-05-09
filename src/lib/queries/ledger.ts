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

/** Map keyed by currency → amount. */
export type AmountByCurrency = Record<string, number>;

export type LedgerSummary = {
  /** Per-currency breakdowns — preserves accuracy for multi-currency
   * operators who don't want FX-mixing. */
  clientOutstanding: AmountByCurrency;
  supplierOutstanding: AmountByCurrency;
  commissionsReceived: AmountByCurrency;
  itdPaidOut: AmountByCurrency;
  itdPending: AmountByCurrency;
  /** Same buckets converted to reporting currency at today's rate.
   * Lossy (rates drift, FX-on-completed-day not preserved here) but
   * useful for at-a-glance org pulse. */
  reportingCurrency: string;
  totalsInReporting: {
    clientOutstanding: number;
    supplierOutstanding: number;
    commissionsReceived: number;
    itdPaidOut: number;
    itdPending: number;
  };
};

/**
 * Org-wide rollup for /admin/ledger. Sums by (kind, status, currency)
 * to preserve per-currency accuracy. For each bucket we also produce
 * a reporting-currency rollup so the KPI strip can show one number
 * per metric without losing the breakdown.
 */
export async function getLedgerSummary(opts?: {
  itdUserId?: string;
  reportingCurrency?: string;
}): Promise<LedgerSummary> {
  const { getRate } = await import("@/lib/fx");
  const reportingCurrency = opts?.reportingCurrency ?? "USD";
  const itdFilter = opts?.itdUserId
    ? eq(ledgerEntries.itdUserId, opts.itdUserId)
    : undefined;

  /* Single round-trip: pull all (kind, status, currency, sum) tuples
   * we care about. Faster than 7× sequential SUMs and easier to
   * reshape in JS. */
  const conditions = [];
  if (itdFilter) conditions.push(itdFilter);
  const rows = await db
    .select({
      kind: ledgerEntries.kind,
      status: ledgerEntries.status,
      currency: ledgerEntries.currency,
      total: sql<number>`coalesce(sum(${ledgerEntries.amount})::float, 0)`,
    })
    .from(ledgerEntries)
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(ledgerEntries.kind, ledgerEntries.status, ledgerEntries.currency);

  const get = (kind: LedgerKind, status: "pending" | "completed") => {
    const out: AmountByCurrency = {};
    for (const r of rows) {
      if (r.kind === kind && r.status === status) {
        out[r.currency] = Number(r.total);
      }
    }
    return out;
  };

  /* Pre-compute all the buckets we need. */
  const invoiced = get("client_invoice", "completed");
  const received = get("client_payment", "completed");
  const supplierCommitted = get("supplier_payment", "pending");
  const supplierPaid = get("supplier_payment", "completed");
  const commissionsReceived = get("commission_received", "completed");
  const itdPaidOut = get("itd_payout", "completed");
  const itdPending = get("itd_payout", "pending");

  const subtractByCurrency = (
    a: AmountByCurrency,
    b: AmountByCurrency,
  ): AmountByCurrency => {
    const out: AmountByCurrency = { ...a };
    for (const [ccy, amt] of Object.entries(b)) {
      out[ccy] = (out[ccy] ?? 0) - amt;
    }
    /* Drop zero rows so the UI doesn't render USD: 0 alongside CLP: 12000. */
    for (const [k, v] of Object.entries(out)) {
      if (Math.abs(v) < 0.005) delete out[k];
    }
    return out;
  };

  const clientOutstanding = subtractByCurrency(invoiced, received);
  const supplierOutstanding = subtractByCurrency(supplierCommitted, supplierPaid);

  /* Convert each per-currency bucket to reporting currency. Reuse
   * rates within this call. */
  const rateCache = new Map<string, number>();
  const rateOf = async (from: string): Promise<number> => {
    if (from === reportingCurrency) return 1;
    if (rateCache.has(from)) return rateCache.get(from)!;
    const r = await getRate(from, reportingCurrency);
    rateCache.set(from, r);
    return r;
  };
  const inReporting = async (bucket: AmountByCurrency): Promise<number> => {
    let total = 0;
    for (const [ccy, amt] of Object.entries(bucket)) {
      total += amt * (await rateOf(ccy));
    }
    return total;
  };

  const totalsInReporting = {
    clientOutstanding: await inReporting(clientOutstanding),
    supplierOutstanding: await inReporting(supplierOutstanding),
    commissionsReceived: await inReporting(commissionsReceived),
    itdPaidOut: await inReporting(itdPaidOut),
    itdPending: await inReporting(itdPending),
  };

  return {
    clientOutstanding,
    supplierOutstanding,
    commissionsReceived,
    itdPaidOut,
    itdPending,
    reportingCurrency,
    totalsInReporting,
  };
}

/**
 * Per-ITD breakdown for the admin /ledger view. Lists every ITD with
 * their pending vs paid commission totals, broken down by currency.
 */
export type ItdLedgerStat = {
  itdUserId: string;
  name: string | null;
  email: string | null;
  pending: AmountByCurrency;
  paid: AmountByCurrency;
};

export async function listItdLedgerStats(): Promise<ItdLedgerStat[]> {
  const rows = await db
    .select({
      itdUserId: ledgerEntries.itdUserId,
      itdName: users.name,
      itdEmail: users.email,
      currency: ledgerEntries.currency,
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
      ledgerEntries.currency,
      ledgerEntries.status,
    );

  const map = new Map<string, ItdLedgerStat>();
  for (const r of rows) {
    if (!r.itdUserId) continue;
    if (!map.has(r.itdUserId)) {
      map.set(r.itdUserId, {
        itdUserId: r.itdUserId,
        name: r.itdName,
        email: r.itdEmail,
        pending: {},
        paid: {},
      });
    }
    const b = map.get(r.itdUserId)!;
    const total = Number(r.total);
    if (Math.abs(total) < 0.005) continue;
    if (r.status === "pending") b.pending[r.currency] = total;
    if (r.status === "completed") b.paid[r.currency] = total;
  }
  return Array.from(map.values()).sort((a, b) => {
    const pendA = Object.values(a.pending).reduce((s, v) => s + v, 0);
    const pendB = Object.values(b.pending).reduce((s, v) => s + v, 0);
    return pendB - pendA;
  });
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
