"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { trips } from "@/lib/db/schema";

export type CreateTripResult =
  | { ok: true; tripId: string }
  | { ok: false; error: string };

export async function createTripAction(
  formData: FormData,
): Promise<CreateTripResult> {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const destination = String(formData.get("destination") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim() || null;
  const endDate = String(formData.get("endDate") ?? "").trim() || null;
  const travelersRaw = String(formData.get("travelerCount") ?? "").trim();
  const budgetRaw = String(formData.get("budgetUsd") ?? "").trim();

  if (!clientId) return { ok: false, error: "clientId required" };
  if (!name) return { ok: false, error: "Trip name is required" };
  if (!destination) return { ok: false, error: "Destination is required" };

  const travelerCount = travelersRaw ? Number(travelersRaw) : 1;
  if (!Number.isFinite(travelerCount) || travelerCount < 1) {
    return { ok: false, error: "Travelers must be a positive integer" };
  }

  const budgetCents = budgetRaw
    ? Math.round(Number(budgetRaw) * 100)
    : null;
  if (budgetCents != null && !Number.isFinite(budgetCents)) {
    return { ok: false, error: "Budget must be a number" };
  }

  if (startDate && endDate && startDate > endDate) {
    return { ok: false, error: "Start date must be before end date" };
  }

  try {
    const [row] = await db
      .insert(trips)
      .values({
        clientId,
        name,
        destination,
        startDate,
        endDate,
        travelerCount,
        budgetCents,
        status: "pending",
      })
      .returning({ id: trips.id });
    revalidatePath("/clients");
    revalidatePath("/trip");
    return { ok: true, tripId: row.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Trip creation failed",
    };
  }
}

export async function createTripAndGo(formData: FormData): Promise<void> {
  const r = await createTripAction(formData);
  if (r.ok) redirect(`/trip?id=${r.tripId}`);
  /* On error, throw so the client transition surfaces it */
  throw new Error(r.error);
}
