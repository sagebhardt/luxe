import "server-only";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLog,
  aiInsights,
  clients,
  trips,
} from "@/lib/db/schema";

const ACTIVE_TRIP_STATUSES = ["active", "pending"] as const;

export type ClientFilter = "all" | "vip" | "active" | "prospect" | "dormant";

export async function listClients(opts: {
  filter?: ClientFilter;
  search?: string;
}) {
  const conditions = [];
  if (opts.filter && opts.filter !== "all") {
    conditions.push(eq(clients.tag, opts.filter));
  }
  if (opts.search?.trim()) {
    conditions.push(ilike(clients.name, `%${opts.search.trim()}%`));
  }
  const activeCount = sql<number>`count(${trips.id})::int`.as("active_count");
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      tag: clients.tag,
      avatarColor: clients.avatarColor,
      lifetimeValueCents: clients.lifetimeValueCents,
      notes: clients.notes,
      activeCount,
    })
    .from(clients)
    .leftJoin(
      trips,
      and(
        eq(trips.clientId, clients.id),
        inArray(trips.status, [...ACTIVE_TRIP_STATUSES]),
      ),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(clients.id)
    .orderBy(desc(activeCount), desc(clients.lifetimeValueCents));

  // Build subtitle: short location/last-trip blurb (taken from notes)
  return rows.map((c) => ({
    ...c,
    subtitle: subtitleFor(c.notes),
    initial: c.name.slice(0, 1),
  }));
}

function subtitleFor(notes: string | null): string {
  if (!notes) return "";
  // notes are " · "-delimited fact strings in seed data
  const first = notes.split("·")[0]?.trim() ?? "";
  return first;
}

export async function getDefaultClientId(): Promise<string | null> {
  const activeCount = sql<number>`count(${trips.id})::int`.as("active_count");
  const [row] = await db
    .select({ id: clients.id, activeCount })
    .from(clients)
    .leftJoin(
      trips,
      and(
        eq(trips.clientId, clients.id),
        inArray(trips.status, [...ACTIVE_TRIP_STATUSES]),
      ),
    )
    .groupBy(clients.id)
    .orderBy(desc(activeCount), desc(clients.lifetimeValueCents))
    .limit(1);
  return row?.id ?? null;
}

export async function getClientDetail(clientId: string) {
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
    with: {
      preferences: true,
      insights: { orderBy: [asc(aiInsights.sortOrder)] },
    },
  });
  if (!client) return null;

  const tripRows = await db.query.trips.findMany({
    where: eq(trips.clientId, clientId),
    orderBy: [desc(trips.startDate)],
    with: {
      agentRuns: {
        columns: { agent: true, status: true },
      },
    },
  });

  const activity = await db
    .select()
    .from(activityLog)
    .where(eq(activityLog.clientId, clientId))
    .orderBy(desc(activityLog.occurredAt))
    .limit(8);

  // KPIs
  const completed = tripRows.filter((t) => t.status === "completed");
  const tripsCount = completed.length;
  const ltv = client.lifetimeValueCents;
  const avgTripValueCents = tripsCount ? Math.round(ltv / tripsCount) : 0;

  // years span for "avg trips/year"
  const oldest = completed[completed.length - 1]?.startDate;
  let years = 1;
  if (oldest) {
    const y = new Date(oldest).getFullYear();
    const now = new Date().getFullYear();
    years = Math.max(1, now - y);
  }
  const avgPerYear = (tripsCount / years).toFixed(1);

  return {
    client,
    trips: tripRows,
    activity,
    kpis: {
      lifetimeValueCents: ltv,
      tripsCount,
      avgTripValueCents,
      avgPerYear,
      npsScore: client.npsScore,
    },
  };
}

// Mark schema imports used (drizzle relations are imported lazily)
void sql;
