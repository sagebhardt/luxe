"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tripAlerts } from "@/lib/db/schema";
import {
  AuthError,
  assertOwnsTrip,
  getCurrentUserOrThrow,
} from "@/lib/auth";

type Result = { ok: true } | { ok: false; error: string };

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function createTripAlertAction(opts: {
  tripId: string;
  body: string;
  kind: "info" | "warn";
  signedBy: string | null;
  clientVisible: boolean;
}): Promise<Result> {
  const body = opts.body.trim();
  if (!body) return { ok: false, error: "Note body is required." };
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsTrip(opts.tripId, viewer);
    const signedBy = opts.signedBy?.trim() || viewer.name || null;
    await db.insert(tripAlerts).values({
      tripId: opts.tripId,
      kind: opts.kind,
      body,
      icon: opts.kind === "warn" ? "⚠" : "✦",
      clientVisible: opts.clientVisible,
      signedBy,
    });
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "create failed") };
  }
}

export async function toggleAlertClientVisibleAction(opts: {
  alertId: string;
  tripId: string;
  clientVisible: boolean;
}): Promise<Result> {
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsTrip(opts.tripId, viewer);
    await db
      .update(tripAlerts)
      .set({ clientVisible: opts.clientVisible })
      .where(eq(tripAlerts.id, opts.alertId));
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "update failed") };
  }
}

export async function deleteTripAlertAction(opts: {
  alertId: string;
  tripId: string;
}): Promise<Result> {
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsTrip(opts.tripId, viewer);
    await db.delete(tripAlerts).where(eq(tripAlerts.id, opts.alertId));
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "delete failed") };
  }
}
