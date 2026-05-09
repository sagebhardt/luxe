"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  bookings,
  ledgerEntries,
  ledgerEntryKind,
  ledgerStatus,
} from "@/lib/db/schema";
import {
  AuthError,
  assertOwnsBooking,
  assertOwnsTrip,
  getCurrentUserOrThrow,
} from "@/lib/auth";

const KINDS = ledgerEntryKind.enumValues;
const STATUSES = ledgerStatus.enumValues;

type Result =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function createLedgerEntryAction(opts: {
  bookingId?: string;
  tripId?: string;
  itdUserId?: string;
  kind: string;
  amount: string;
  currency: string;
  reference?: string;
  status?: string;
  occurredOn: string;
  notes?: string;
}): Promise<Result> {
  if (!KINDS.includes(opts.kind as (typeof KINDS)[number])) {
    return { ok: false, error: `Unknown kind: ${opts.kind}` };
  }
  const status = (opts.status ?? "pending") as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) {
    return { ok: false, error: `Unknown status: ${opts.status}` };
  }
  const amount = Number(opts.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a positive number" };
  }
  if (!opts.currency || opts.currency.length < 3) {
    return { ok: false, error: "Currency required" };
  }
  if (!opts.occurredOn) {
    return { ok: false, error: "occurredOn required" };
  }

  try {
    const viewer = await getCurrentUserOrThrow();

    /* Tenancy: ITDs can only post entries against bookings/trips they
     * own. itd_payout entries are admin-only (it represents money
     * Odylic pays them). */
    if (opts.kind === "itd_payout" && viewer.role !== "admin") {
      return {
        ok: false,
        error: "Only admins can record ITD payouts",
      };
    }

    let resolvedTripId = opts.tripId ?? null;
    if (opts.bookingId) {
      await assertOwnsBooking(opts.bookingId, viewer);
      if (!resolvedTripId) {
        const b = await db.query.bookings.findFirst({
          where: eq(bookings.id, opts.bookingId),
          columns: { tripId: true },
        });
        resolvedTripId = b?.tripId ?? null;
      }
    } else if (resolvedTripId) {
      await assertOwnsTrip(resolvedTripId, viewer);
    }

    const [row] = await db
      .insert(ledgerEntries)
      .values({
        bookingId: opts.bookingId ?? null,
        tripId: resolvedTripId,
        itdUserId: opts.itdUserId ?? null,
        kind: opts.kind as (typeof KINDS)[number],
        amount: amount.toFixed(2),
        currency: opts.currency.toUpperCase(),
        reference: opts.reference || null,
        status,
        occurredOn: opts.occurredOn,
        notes: opts.notes || null,
        recordedByUserId: viewer.id,
      })
      .returning({ id: ledgerEntries.id });

    revalidatePath("/trip");
    revalidatePath("/admin/ledger");
    revalidatePath("/settings");
    return { ok: true, id: row.id };
  } catch (err) {
    return { ok: false, error: authError(err, "create entry failed") };
  }
}

export async function setLedgerStatusAction(
  entryId: string,
  status: "pending" | "completed" | "cancelled",
): Promise<Result> {
  if (!entryId) return { ok: false, error: "entryId required" };
  if (!STATUSES.includes(status)) {
    return { ok: false, error: `Unknown status: ${status}` };
  }
  try {
    const viewer = await getCurrentUserOrThrow();
    const entry = await db.query.ledgerEntries.findFirst({
      where: eq(ledgerEntries.id, entryId),
      columns: { bookingId: true, tripId: true, kind: true },
    });
    if (!entry) return { ok: false, error: "Entry not found" };

    /* Marking ITD payouts paid is admin-only. Other status changes
     * (e.g. operator marking client invoice paid) are allowed for
     * the trip's owner. */
    if (entry.kind === "itd_payout" && viewer.role !== "admin") {
      return {
        ok: false,
        error: "Only admins can update ITD payout status",
      };
    }
    if (entry.bookingId) {
      await assertOwnsBooking(entry.bookingId, viewer);
    } else if (entry.tripId) {
      await assertOwnsTrip(entry.tripId, viewer);
    }

    await db
      .update(ledgerEntries)
      .set({ status })
      .where(eq(ledgerEntries.id, entryId));
    revalidatePath("/trip");
    revalidatePath("/admin/ledger");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "update status failed") };
  }
}

export async function deleteLedgerEntryAction(
  entryId: string,
): Promise<Result> {
  if (!entryId) return { ok: false, error: "entryId required" };
  try {
    const viewer = await getCurrentUserOrThrow();
    const entry = await db.query.ledgerEntries.findFirst({
      where: eq(ledgerEntries.id, entryId),
      columns: { bookingId: true, tripId: true, kind: true },
    });
    if (!entry) return { ok: false, error: "Entry not found" };
    if (entry.kind === "itd_payout" && viewer.role !== "admin") {
      return { ok: false, error: "Only admins can delete payout entries" };
    }
    if (entry.bookingId) {
      await assertOwnsBooking(entry.bookingId, viewer);
    } else if (entry.tripId) {
      await assertOwnsTrip(entry.tripId, viewer);
    }
    await db.delete(ledgerEntries).where(eq(ledgerEntries.id, entryId));
    revalidatePath("/trip");
    revalidatePath("/admin/ledger");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "delete failed") };
  }
}
