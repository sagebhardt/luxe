"use server";

import { revalidatePath } from "next/cache";
import {
  generateTripNarrative,
  NarrativeAgentError,
} from "@/lib/ai/agents/trip-narrative";
import { ProviderConfigError } from "@/lib/ai/registry";

type Result =
  | { ok: true }
  | { ok: false; error: string };

export async function generateNarrativeAction(
  tripId: string,
): Promise<Result> {
  try {
    await generateTripNarrative(tripId);
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    const error =
      err instanceof NarrativeAgentError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "narrative generation failed";
    return { ok: false, error };
  }
}
