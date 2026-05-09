"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityLog, clients, trips } from "@/lib/db/schema";
import {
  buildTripFromPrompt,
  TripBuilderError,
  type TripBuilderOutput,
} from "@/lib/ai/agents/trip-builder";
import { ProviderConfigError } from "@/lib/ai/registry";
import {
  AuthError,
  assertOwnsClient,
  getCurrentUserOrThrow,
} from "@/lib/auth";

const AVATAR_COLORS = ["av-1", "av-2", "av-3", "av-4", "av-5"] as const;
const ALLOWED_TAGS = ["vip", "active", "prospect", "dormant"] as const;

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

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
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsClient(clientId, viewer);
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
    return { ok: false, error: authError(err, "Trip creation failed") };
  }
}

export async function createTripAndGo(formData: FormData): Promise<void> {
  const r = await createTripAction(formData);
  if (r.ok) redirect(`/trip?id=${r.tripId}`);
  /* On error, throw so the client transition surfaces it */
  throw new Error(r.error);
}

export type ProposeTripResult =
  | { ok: true; proposal: TripBuilderOutput }
  | { ok: false; error: string };

export async function proposeTripAction(
  clientId: string,
  prompt: string,
): Promise<ProposeTripResult> {
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsClient(clientId, viewer);
    const proposal = await buildTripFromPrompt({ clientId, prompt });
    return { ok: true, proposal };
  } catch (err) {
    const error =
      err instanceof AuthError ||
      err instanceof TripBuilderError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "trip parse failed";
    return { ok: false, error };
  }
}

export async function createTripFromProposalAction(opts: {
  clientId: string;
  proposal: TripBuilderOutput;
}): Promise<CreateTripResult> {
  const { clientId, proposal } = opts;
  if (!clientId) return { ok: false, error: "clientId required" };
  if (!proposal.destination)
    return { ok: false, error: "Destination is required" };

  /* Persist segments + agent summary into trip.summary so itinerary
   * agent and the share page can see the multi-leg structure. */
  const summaryLines = [
    proposal.summary,
    "",
    proposal.segments
      .map((s, i) => {
        const note = s.notes ? ` — ${s.notes}` : "";
        return `Leg ${i + 1}: ${s.destination} (${s.days} day${s.days === 1 ? "" : "s"})${note}`;
      })
      .join("\n"),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsClient(clientId, viewer);
    const [row] = await db
      .insert(trips)
      .values({
        clientId,
        name: proposal.name,
        destination: proposal.destination,
        startDate: proposal.startDate,
        endDate: proposal.endDate,
        travelerCount: proposal.travelerCount,
        budgetCents:
          proposal.budgetUsd != null
            ? Math.round(proposal.budgetUsd * 100)
            : null,
        status: "pending",
        summary: summaryLines,
      })
      .returning({ id: trips.id });
    revalidatePath("/clients");
    revalidatePath("/trip");
    return { ok: true, tripId: row.id };
  } catch (err) {
    return { ok: false, error: authError(err, "Trip creation failed") };
  }
}

export type CreateClientResult =
  | { ok: true; clientId: string }
  | { ok: false; error: string };

export type SaveNoteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveNoteAction(
  clientId: string,
  body: string,
): Promise<SaveNoteResult> {
  const text = body.trim();
  if (!text) return { ok: false, error: "Note cannot be empty" };
  if (!clientId) return { ok: false, error: "clientId is required" };
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsClient(clientId, viewer);
    await db.insert(activityLog).values({
      clientId,
      type: "note",
      actor: "operator",
      summary: text,
    });
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "Save failed") };
  }
}

export async function createClientAction(
  formData: FormData,
): Promise<CreateClientResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const tagRaw = String(formData.get("tag") ?? "prospect");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) return { ok: false, error: "Name is required" };
  if (!ALLOWED_TAGS.includes(tagRaw as (typeof ALLOWED_TAGS)[number])) {
    return { ok: false, error: `Unknown tag: ${tagRaw}` };
  }
  const tag = tagRaw as (typeof ALLOWED_TAGS)[number];

  /* Cycle avatar color by hash of name so the same name always gets
   * the same chip color. Avoids a column-width-of-the-day flicker. */
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const avatarColor = AVATAR_COLORS[hash % AVATAR_COLORS.length];

  try {
    const viewer = await getCurrentUserOrThrow();
    /* New clients are owned by their creating ITD by default. Admins
     * creating a client also get listed as the owner — they can
     * reassign later. */
    const [row] = await db
      .insert(clients)
      .values({
        name,
        email,
        phone,
        tag,
        avatarColor,
        notes,
        lifetimeValueCents: 0,
        ownerId: viewer.id,
      })
      .returning({ id: clients.id });
    revalidatePath("/clients");
    return { ok: true, clientId: row.id };
  } catch (err) {
    return { ok: false, error: authError(err, "Client creation failed") };
  }
}
