"use server";

import { revalidatePath } from "next/cache";
import {
  generateTripNarrative,
  NarrativeAgentError,
} from "@/lib/ai/agents/trip-narrative";
import { ProviderConfigError } from "@/lib/ai/registry";
import {
  AuthError,
  assertOwnsTrip,
  getCurrentUserOrThrow,
} from "@/lib/auth";

type Result =
  | { ok: true }
  | { ok: false; error: string };

export async function generateNarrativeAction(
  tripId: string,
): Promise<Result> {
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsTrip(tripId, viewer);
    await generateTripNarrative(tripId);
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    const error =
      err instanceof AuthError ||
      err instanceof NarrativeAgentError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "narrative generation failed";
    return { ok: false, error };
  }
}
