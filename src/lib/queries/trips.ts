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
} from "@/lib/db/schema";

export type SidebarTrip = {
  id: string;
  name: string;
  status: (typeof trips.$inferSelect)["status"];
  startDate: string | null;
  endDate: string | null;
  subtitle: string;
};

export async function listSidebarTrips(): Promise<{
  active: SidebarTrip[];
  completed: SidebarTrip[];
}> {
  const rows = await db.query.trips.findMany({
    orderBy: [asc(trips.startDate)],
  });
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

export async function getDefaultTripId(): Promise<string | null> {
  const [row] = await db
    .select({ id: trips.id })
    .from(trips)
    .where(eq(trips.status, "active"))
    .orderBy(asc(trips.startDate))
    .limit(1);
  return row?.id ?? null;
}

export async function getTripDetail(tripId: string) {
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
