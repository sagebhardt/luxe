import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  clients,
  documents,
  trips,
  users,
} from "@/lib/db/schema";

/**
 * Auth bridge between Clerk and our local users table. Each authenticated
 * Clerk user has a corresponding row in `users`, lazy-provisioned the
 * first time they make an authenticated request after migration 0012.
 *
 * Tenancy model:
 *  - Every client is owned by one user (an ITD).
 *  - All trips/bookings/docs/etc. inherit ownership transitively via
 *    `clients.owner_id`.
 *  - Role 'admin' (e.g. Odylic operations team) bypasses scoping for
 *    reads. Admin Clerk IDs are listed in ADMIN_USER_IDS env var
 *    (comma-separated). On first provision, matching IDs become 'admin'.
 */

export type Viewer = typeof users.$inferSelect;

const ADMIN_IDS = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export async function getCurrentUser(): Promise<Viewer | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkUserId, clerkId),
  });
  if (existing) return existing;

  /* First request after migration: pull profile from Clerk and provision. */
  const profile = await currentUser();
  const desiredRole = ADMIN_IDS.includes(clerkId) ? "admin" : "itd";
  const [row] = await db
    .insert(users)
    .values({
      clerkUserId: clerkId,
      name:
        profile?.fullName ||
        [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
        null,
      email: profile?.primaryEmailAddress?.emailAddress ?? null,
      role: desiredRole,
    })
    .onConflictDoNothing({ target: users.clerkUserId })
    .returning();
  /* If onConflictDoNothing skipped (race), re-fetch. */
  if (!row) {
    const refetched = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkId),
    });
    return refetched ?? null;
  }
  return row;
}

export async function getCurrentUserOrThrow(): Promise<Viewer> {
  const v = await getCurrentUser();
  if (!v) throw new AuthError("Not authenticated");
  return v;
}

export async function requireAdmin(): Promise<Viewer> {
  const v = await getCurrentUserOrThrow();
  if (v.role !== "admin") throw new AuthError("Admin access required");
  return v;
}

/* ----------------------- ownership assertions -----------------------
 * Each helper returns the row (so the caller can use it) and throws
 * if the viewer doesn't own the resource. Admins always pass. */

export async function assertOwnsClient(clientId: string, viewer: Viewer) {
  const row = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
    columns: { id: true, ownerId: true },
  });
  if (!row) throw new AuthError("Client not found");
  if (viewer.role === "admin") return row;
  if (row.ownerId !== viewer.id) throw new AuthError("Not your client");
  return row;
}

export async function assertOwnsTrip(tripId: string, viewer: Viewer) {
  const row = await db
    .select({
      id: trips.id,
      clientId: trips.clientId,
      ownerId: clients.ownerId,
    })
    .from(trips)
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(eq(trips.id, tripId))
    .limit(1);
  const r = row[0];
  if (!r) throw new AuthError("Trip not found");
  if (viewer.role === "admin") return r;
  if (r.ownerId !== viewer.id) throw new AuthError("Not your trip");
  return r;
}

export async function assertOwnsBooking(bookingId: string, viewer: Viewer) {
  const row = await db
    .select({
      id: bookings.id,
      tripId: bookings.tripId,
      ownerId: clients.ownerId,
    })
    .from(bookings)
    .innerJoin(trips, eq(trips.id, bookings.tripId))
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(eq(bookings.id, bookingId))
    .limit(1);
  const r = row[0];
  if (!r) throw new AuthError("Booking not found");
  if (viewer.role === "admin") return r;
  if (r.ownerId !== viewer.id) throw new AuthError("Not your booking");
  return r;
}

export async function assertOwnsDocument(documentId: string, viewer: Viewer) {
  const row = await db
    .select({
      id: documents.id,
      clientId: documents.clientId,
      ownerId: clients.ownerId,
    })
    .from(documents)
    .innerJoin(clients, eq(clients.id, documents.clientId))
    .where(eq(documents.id, documentId))
    .limit(1);
  const r = row[0];
  if (!r) throw new AuthError("Document not found");
  if (viewer.role === "admin") return r;
  if (r.ownerId !== viewer.id) throw new AuthError("Not your document");
  return r;
}

/** Drizzle-friendly ownership predicate for read queries. Returns
 * conditions that, ANDed with whatever else, scope by viewer.
 * Admins get an always-true predicate so callers can pass it in
 * blindly without branching. */
export function clientOwnedBy(viewer: Viewer) {
  if (viewer.role === "admin") return undefined;
  return eq(clients.ownerId, viewer.id);
}

/** For queries on tables that join through clients (trips, bookings,
 * documents, etc.), use this to add the ownership AND clause. */
export function joinedClientOwnedBy(viewer: Viewer) {
  if (viewer.role === "admin") return undefined;
  return eq(clients.ownerId, viewer.id);
}

/** Combine ownership with another condition, omitting it for admins. */
export function withOwnership<T>(viewer: Viewer, condition: T) {
  const own = clientOwnedBy(viewer);
  if (!own) return condition;
  return and(condition as Parameters<typeof and>[0], own);
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
