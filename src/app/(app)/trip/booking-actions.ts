"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, trips } from "@/lib/db/schema";
import { getRate } from "@/lib/fx";
import {
  AuthError,
  assertOwnsBooking,
  getCurrentUserOrThrow,
} from "@/lib/auth";

type Result = { ok: true } | { ok: false; error: string };

function authError(err: unknown, fallback: string): string {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/**
 * Save sell + cost on a booking. Cost is editable until locked.
 * Sell is always editable (the agency can re-quote the client).
 */
export async function setBookingFinancialsAction(
  bookingId: string,
  patch: {
    sellAmount?: string | null;
    costAmount?: string | null;
    costCurrency?: string | null;
  },
): Promise<Result> {
  if (!bookingId) return { ok: false, error: "bookingId required" };
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsBooking(bookingId, viewer);
    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      columns: { id: true, costLocked: true },
    });
    if (!existing) return { ok: false, error: "Booking not found" };

    const update: Record<string, unknown> = {};
    if (patch.sellAmount !== undefined) {
      const v = patch.sellAmount == null ? null : parseAmount(patch.sellAmount);
      update.sellAmount = v == null ? null : v.toFixed(2);
    }
    if (!existing.costLocked) {
      if (patch.costAmount !== undefined) {
        const v = patch.costAmount == null ? null : parseAmount(patch.costAmount);
        update.costAmount = v == null ? null : v.toFixed(2);
      }
      if (patch.costCurrency !== undefined) {
        update.costCurrency = patch.costCurrency || null;
      }
    }

    if (Object.keys(update).length === 0) return { ok: true };
    await db.update(bookings).set(update).where(eq(bookings.id, bookingId));
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "save failed",
    };
  }
}

/**
 * Lock a booking's cost — captures the current FX rate from cost
 * currency to the trip's base currency, freezes the values for
 * historical accuracy.
 */
export async function lockBookingCostAction(
  bookingId: string,
): Promise<Result> {
  if (!bookingId) return { ok: false, error: "bookingId required" };
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsBooking(bookingId, viewer);
    const row = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      columns: {
        id: true,
        tripId: true,
        costAmount: true,
        costCurrency: true,
        costLocked: true,
      },
    });
    if (!row) return { ok: false, error: "Booking not found" };
    if (row.costLocked) return { ok: true };
    if (!row.costAmount || !row.costCurrency) {
      return {
        ok: false,
        error: "Set cost amount and currency before locking",
      };
    }

    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, row.tripId),
      columns: { baseCurrency: true },
    });
    const baseCurrency = trip?.baseCurrency ?? "USD";

    const rate = await getRate(row.costCurrency, baseCurrency);

    await db
      .update(bookings)
      .set({
        costFxToBase: rate.toFixed(8),
        costLocked: true,
        costLockedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "lock failed",
    };
  }
}

/** Unlock so the operator can edit again. Clears the FX rate so the
 * next lock captures fresh. */
export async function unlockBookingCostAction(
  bookingId: string,
): Promise<Result> {
  if (!bookingId) return { ok: false, error: "bookingId required" };
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsBooking(bookingId, viewer);
    await db
      .update(bookings)
      .set({
        costLocked: false,
        costLockedAt: null,
        costFxToBase: null,
      })
      .where(eq(bookings.id, bookingId));
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unlock failed",
    };
  }
}
