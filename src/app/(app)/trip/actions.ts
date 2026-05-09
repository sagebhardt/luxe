"use server";

import { revalidatePath } from "next/cache";
import { runFlightAgent, FlightAgentInputError } from "@/lib/ai/agents/flight";
import { ProviderConfigError } from "@/lib/ai/registry";

export type RunFlightAgentResult =
  | { ok: true; decisionId: string | null; runId: string }
  | { ok: false; error: string };

export async function runFlightAgentAction(
  tripId: string,
): Promise<RunFlightAgentResult> {
  try {
    const result = await runFlightAgent(tripId);
    revalidatePath("/trip");
    return {
      ok: true,
      decisionId: result.decisionId,
      runId: result.runId,
    };
  } catch (err) {
    const error =
      err instanceof FlightAgentInputError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "unknown failure";
    return { ok: false, error };
  }
}
