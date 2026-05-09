import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tripShareTokens } from "@/lib/db/schema";

/* Generates a 22-char base64url unguessable token (~128 bits of entropy). */
function newToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function createTripShareToken(opts: {
  tripId: string;
  label?: string;
}): Promise<{ id: string; token: string }> {
  const token = newToken();
  const [row] = await db
    .insert(tripShareTokens)
    .values({
      tripId: opts.tripId,
      token,
      label: opts.label ?? null,
    })
    .returning({ id: tripShareTokens.id, token: tripShareTokens.token });
  return row;
}

export async function revokeTripShareToken(id: string): Promise<void> {
  await db
    .update(tripShareTokens)
    .set({ revokedAt: new Date() })
    .where(eq(tripShareTokens.id, id));
}

export async function touchTokenVisit(token: string): Promise<void> {
  await db
    .update(tripShareTokens)
    .set({ lastVisitedAt: new Date() })
    .where(eq(tripShareTokens.token, token));
}
