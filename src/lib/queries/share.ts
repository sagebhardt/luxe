import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentDecisions,
  agentLogMessages,
  bookings,
  clients,
  trips,
  tripShareTokens,
} from "@/lib/db/schema";

export async function findValidToken(token: string) {
  const row = await db.query.tripShareTokens.findFirst({
    where: and(
      eq(tripShareTokens.token, token),
      isNull(tripShareTokens.revokedAt),
    ),
  });
  return row ?? null;
}

export async function listTripTokens(tripId: string) {
  return db
    .select()
    .from(tripShareTokens)
    .where(eq(tripShareTokens.tripId, tripId))
    .orderBy(asc(tripShareTokens.createdAt));
}

export async function getSharedTripDetail(tripId: string) {
  return db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      client: true,
      bookings: { orderBy: [asc(bookings.occursOn), asc(bookings.createdAt)] },
      log: { orderBy: [asc(agentLogMessages.occurredAt)] },
      decisions: {
        where: eq(agentDecisions.status, "pending_approval"),
      },
    },
  });
}

/* Type unused but referenced for relations init */
void clients;
