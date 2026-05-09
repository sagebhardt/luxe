import "server-only";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLog,
  aiInsights,
  clients,
  trips,
} from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth";

const ACTIVE_TRIP_STATUSES = ["active", "pending"] as const;

export type ClientFilter = "all" | "vip" | "active" | "prospect" | "dormant";

/** Tenancy filter on the clients table. Admins get undefined (no
 * scoping); ITDs get an `owner_id = viewer.id` predicate. */
function ownerFilter(viewer: Viewer) {
  return viewer.role === "admin" ? undefined : eq(clients.ownerId, viewer.id);
}

export async function listClients(
  viewer: Viewer,
  opts: {
    filter?: ClientFilter;
    search?: string;
  },
) {
  const conditions = [];
  const own = ownerFilter(viewer);
  if (own) conditions.push(own);
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

export async function getDefaultClientId(
  viewer: Viewer,
): Promise<string | null> {
  const activeCount = sql<number>`count(${trips.id})::int`.as("active_count");
  const own = ownerFilter(viewer);
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
    .where(own)
    .groupBy(clients.id)
    .orderBy(desc(activeCount), desc(clients.lifetimeValueCents))
    .limit(1);
  return row?.id ?? null;
}

export async function getClientDetail(clientId: string, viewer: Viewer) {
  const ownConditions =
    viewer.role === "admin"
      ? eq(clients.id, clientId)
      : and(eq(clients.id, clientId), eq(clients.ownerId, viewer.id));
  const client = await db.query.clients.findFirst({
    where: ownConditions,
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
