"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tripShareTokens } from "@/lib/db/schema";
import {
  createTripShareToken,
  revokeTripShareToken,
} from "@/lib/share/tokens";
import {
  AuthError,
  assertOwnsTrip,
  getCurrentUserOrThrow,
} from "@/lib/auth";

type CreateResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function createShareTokenAction(
  tripId: string,
): Promise<CreateResult> {
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsTrip(tripId, viewer);
    const row = await createTripShareToken({ tripId });
    revalidatePath("/trip");
    return { ok: true, token: row.token };
  } catch (err) {
    return { ok: false, error: authError(err, "create failed") };
  }
}

export async function revokeShareTokenAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const viewer = await getCurrentUserOrThrow();
    /* Look up the token's trip, then assert ownership of that trip. */
    const tok = await db.query.tripShareTokens.findFirst({
      where: eq(tripShareTokens.id, id),
      columns: { tripId: true },
    });
    if (!tok) return { ok: false, error: "Token not found" };
    await assertOwnsTrip(tok.tripId, viewer);
    await revokeTripShareToken(id);
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "revoke failed") };
  }
}
