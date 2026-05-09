import "server-only";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, clients, trips, users } from "@/lib/db/schema";

/**
 * Admin-only queries: roster of every ITD/admin in the system, with
 * a quick "book health" snapshot — client count + sell volume — so
 * an admin can size up the network at a glance.
 */

export async function listUsersWithStats() {
  /* Client count per user — left join so a brand-new ITD with 0
   * clients still shows up. */
  const clientCounts = await db
    .select({
      ownerId: clients.ownerId,
      count: count(clients.id).as("count"),
    })
    .from(clients)
    .groupBy(clients.ownerId);
  const clientCountMap = new Map<string, number>();
  for (const row of clientCounts) {
    if (row.ownerId) clientCountMap.set(row.ownerId, Number(row.count));
  }

  /* Total sell volume per user (sum of confirmed/pending bookings'
   * sellAmount, in trip base currency — not converted, just a rough
   * "this ITD has booked X" indicator). */
  const sellSums = await db
    .select({
      ownerId: clients.ownerId,
      total: sql<number>`coalesce(sum(${bookings.sellAmount})::float, 0)`,
    })
    .from(bookings)
    .innerJoin(trips, eq(trips.id, bookings.tripId))
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .groupBy(clients.ownerId);
  const sellMap = new Map<string, number>();
  for (const row of sellSums) {
    if (row.ownerId) sellMap.set(row.ownerId, Number(row.total));
  }

  const userRows = await db.select().from(users).orderBy(desc(users.createdAt));

  return userRows.map((u) => ({
    id: u.id,
    clerkUserId: u.clerkUserId,
    name: u.name,
    email: u.email,
    role: u.role,
    commissionPctBase: u.commissionPctBase,
    createdAt: u.createdAt,
    clientCount: clientCountMap.get(u.id) ?? 0,
    sellTotal: sellMap.get(u.id) ?? 0,
  }));
}

export type UserWithStats = Awaited<
  ReturnType<typeof listUsersWithStats>
>[number];
