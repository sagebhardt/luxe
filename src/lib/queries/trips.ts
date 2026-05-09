import "server-only";
import { and, asc, desc, eq, inArray, sql, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentDecisions,
  agentLogMessages,
  agentRuns,
  bookings,
  clients,
  travelerPreferences,
  tripAlerts,
  trips,
  tripShareTokens,
  users,
} from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth";

/* Tenancy filter on the clients table. ITDs see only trips for clients
 * they own; admins see all. Used by the queries below to AND into
 * their existing predicates. */
function ownerFilter(viewer: Viewer) {
  return viewer.role === "admin" ? undefined : eq(clients.ownerId, viewer.id);
}

export type SidebarTrip = {
  id: string;
  name: string;
  status: (typeof trips.$inferSelect)["status"];
  startDate: string | null;
  endDate: string | null;
  subtitle: string;
};

export async function listSidebarTrips(viewer: Viewer): Promise<{
  active: SidebarTrip[];
  completed: SidebarTrip[];
}> {
  /* Drizzle's nested relations don't auto-filter by joined tables, so
   * we hand-roll the join through clients to enforce ownership. */
  const own = ownerFilter(viewer);
  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      status: trips.status,
      startDate: trips.startDate,
      endDate: trips.endDate,
      summary: trips.summary,
    })
    .from(trips)
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(own)
    .orderBy(asc(trips.startDate));
  const fmtSubtitle = (t: (typeof rows)[number]): string => {
    if (!t.startDate || !t.endDate) return t.summary ?? "";
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    const months = [
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
    if (t.status === "completed") {
      return `${months[start.getMonth()]} ${start.getFullYear()}`;
    }
    if (t.status === "pending") {
      return `${months[start.getMonth()]} ${start.getDate()}–${end.getDate()} · planning`;
    }
    const nights = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `${months[start.getMonth()]} ${start.getDate()}–${end.getDate()} · ${nights} nights`;
  };

  return {
    active: rows
      .filter((t) => t.status === "active" || t.status === "pending")
      .map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        startDate: t.startDate,
        endDate: t.endDate,
        subtitle: fmtSubtitle(t),
      })),
    completed: rows
      .filter((t) => t.status === "completed")
      .map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        startDate: t.startDate,
        endDate: t.endDate,
        subtitle: fmtSubtitle(t),
      })),
  };
}

export async function getDefaultTripId(
  viewer: Viewer,
): Promise<string | null> {
  const own = ownerFilter(viewer);
  const conditions = own
    ? and(eq(trips.status, "active"), own)
    : eq(trips.status, "active");
  const [row] = await db
    .select({ id: trips.id })
    .from(trips)
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(conditions)
    .orderBy(asc(trips.startDate))
    .limit(1);
  return row?.id ?? null;
}

export async function getTripDetail(tripId: string, viewer: Viewer) {
  /* First gate: the trip belongs to a client owned by the viewer.
   * We do this with a join-and-check rather than a relation filter
   * because Drizzle's `with: { client }` doesn't push the predicate
   * down — we have to enforce ownership at the outer level. */
  const ownCheck = await db
    .select({ id: trips.id })
    .from(trips)
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(
      viewer.role === "admin"
        ? eq(trips.id, tripId)
        : and(eq(trips.id, tripId), eq(clients.ownerId, viewer.id)),
    )
    .limit(1);
  if (!ownCheck[0]) return null;

  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      client: {
        with: {
          preferences: true,
        },
      },
      agentRuns: { orderBy: [asc(agentRuns.createdAt)] },
      decisions: {
        where: eq(agentDecisions.status, "pending_approval"),
        orderBy: [desc(agentDecisions.createdAt)],
      },
      bookings: { orderBy: [asc(bookings.occursOn), asc(bookings.createdAt)] },
      log: { orderBy: [asc(agentLogMessages.occurredAt)] },
      alerts: { orderBy: [asc(tripAlerts.sortOrder)] },
    },
  });
  return trip;
}

export type TripBudgetCategory = {
  key: "flight" | "hotel" | "dining" | "remaining";
  label: string;
  cents: number;
  pctOfMax: number;
  color: string; // CSS variable name
};

export async function getTripBudget(
  tripId: string,
): Promise<{
  budgetCents: number;
  categories: TripBudgetCategory[];
  remainingCents: number;
}> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    columns: { budgetCents: true },
  });
  const sums = await db
    .select({
      kind: bookings.kind,
      total: sql<number>`coalesce(sum(${bookings.priceCents}), 0)`,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tripId, tripId),
        inArray(bookings.kind, ["flight", "hotel", "dining"]),
      ),
    )
    .groupBy(bookings.kind);

  const totals = new Map(sums.map((s) => [s.kind, Number(s.total)]));
  const flight = totals.get("flight") ?? 0;
  const hotel = totals.get("hotel") ?? 0;
  const dining = totals.get("dining") ?? 0;
  const budget = trip?.budgetCents ?? 0;
  const used = flight + hotel + dining;
  const remaining = Math.max(0, budget - used);
  const max = Math.max(flight, hotel, dining, remaining, 1);

  const cats: TripBudgetCategory[] = [
    {
      key: "flight",
      label: "Flights",
      cents: flight,
      pctOfMax: Math.round((flight / max) * 100),
      color: "var(--bark)",
    },
    {
      key: "hotel",
      label: "Hotels",
      cents: hotel,
      pctOfMax: Math.round((hotel / max) * 100),
      color: "var(--sage)",
    },
    {
      key: "dining",
      label: "Dining",
      cents: dining,
      pctOfMax: Math.round((dining / max) * 100),
      color: "var(--forest)",
    },
    {
      key: "remaining",
      label: "Remaining",
      cents: remaining,
      pctOfMax: Math.round((remaining / max) * 100),
      color: "var(--parchment)",
    },
  ];

  return { budgetCents: budget, categories: cats, remainingCents: remaining };
}

/**
 * Roll up sell + cost across a trip's bookings, expressed in the
 * trip's base currency. For locked rows we use the FX rate captured
 * at lock time (historical accuracy). For unlocked rows we use today's
 * rate as an estimate; we surface the unlocked count so the hero can
 * mark the result as estimated.
 *
 * Commission split: looks up the trip's owning ITD's commissionPctBase
 * (default 0.5 = 50/50). Returns itdShare and odylicShare derived
 * from the total margin. If the trip has no owner (legacy/seed data
 * not yet backfilled), defaults to 50/50.
 */
export async function getTripFinancials(tripId: string): Promise<{
  baseCurrency: string;
  sellInBase: number;
  costInBase: number;
  margin: number;
  marginPct: number | null;
  itdShare: number;
  odylicShare: number;
  itdSharePct: number;
  unlockedCount: number;
  hasAnyData: boolean;
}> {
  const { getRate } = await import("@/lib/fx");
  /* Pull trip + its owner's commission tier in one round-trip. */
  const tripWithOwner = await db
    .select({
      baseCurrency: trips.baseCurrency,
      commissionPctBase: users.commissionPctBase,
    })
    .from(trips)
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .leftJoin(users, eq(users.id, clients.ownerId))
    .where(eq(trips.id, tripId))
    .limit(1);
  const baseCurrency = tripWithOwner[0]?.baseCurrency ?? "USD";
  const itdSharePct = Number(tripWithOwner[0]?.commissionPctBase ?? "0.5");

  const rows = await db
    .select({
      sellAmount: bookings.sellAmount,
      costAmount: bookings.costAmount,
      costCurrency: bookings.costCurrency,
      costFxToBase: bookings.costFxToBase,
      costLocked: bookings.costLocked,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tripId, tripId),
        inArray(bookings.status, ["confirmed", "pending"]),
      ),
    );

  let sellInBase = 0;
  let costInBase = 0;
  let unlockedCount = 0;
  let hasAnyData = false;

  for (const r of rows) {
    if (r.sellAmount) {
      sellInBase += Number(r.sellAmount);
      hasAnyData = true;
    }
    if (r.costAmount) {
      hasAnyData = true;
      const ccy = r.costCurrency ?? baseCurrency;
      let rate: number;
      if (r.costLocked && r.costFxToBase) {
        rate = Number(r.costFxToBase);
      } else {
        unlockedCount += 1;
        rate = ccy === baseCurrency ? 1 : await getRate(ccy, baseCurrency);
      }
      costInBase += Number(r.costAmount) * rate;
    }
  }

  const margin = sellInBase - costInBase;
  const marginPct = sellInBase > 0 ? (margin / sellInBase) * 100 : null;
  const itdShare = margin * itdSharePct;
  const odylicShare = margin - itdShare;

  return {
    baseCurrency,
    sellInBase,
    costInBase,
    margin,
    marginPct,
    itdShare,
    odylicShare,
    itdSharePct,
    unlockedCount,
    hasAnyData,
  };
}

export async function listActiveShareTokens(tripId: string) {
  return db
    .select()
    .from(tripShareTokens)
    .where(
      and(
        eq(tripShareTokens.tripId, tripId),
        isNull(tripShareTokens.revokedAt),
      ),
    )
    .orderBy(desc(tripShareTokens.createdAt));
}

// Light helper for relations import preservation
void clients;
void travelerPreferences;
