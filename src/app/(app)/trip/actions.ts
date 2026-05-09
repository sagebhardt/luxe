"use server";

import { revalidatePath } from "next/cache";
import { runFlightAgent, FlightAgentInputError } from "@/lib/ai/agents/flight";
import { runHotelAgent, HotelAgentInputError } from "@/lib/ai/agents/hotel";
import {
  runItineraryAgent,
  ItineraryAgentInputError,
} from "@/lib/ai/agents/itinerary";
import { runDiningAgent, DiningAgentInputError } from "@/lib/ai/agents/dining";
import { ProviderConfigError } from "@/lib/ai/registry";
import {
  AuthError,
  assertOwnsTrip,
  getCurrentUserOrThrow,
} from "@/lib/auth";

export type AgentKind = "flight" | "hotel" | "itinerary" | "dining";

export type RunAgentResult =
  | { ok: true; runId: string; decisionId: string | null }
  | { ok: false; error: string };

export async function runAgentAction(
  agent: AgentKind,
  tripId: string,
): Promise<RunAgentResult> {
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsTrip(tripId, viewer);
    let result;
    switch (agent) {
      case "flight":
        result = await runFlightAgent(tripId);
        break;
      case "hotel":
        result = await runHotelAgent(tripId);
        break;
      case "itinerary":
        result = await runItineraryAgent(tripId);
        break;
      case "dining":
        result = await runDiningAgent(tripId);
        break;
    }
    revalidatePath("/trip");
    return {
      ok: true,
      runId: result.runId,
      decisionId: result.decisionId,
    };
  } catch (err) {
    const error =
      err instanceof AuthError ||
      err instanceof FlightAgentInputError ||
      err instanceof HotelAgentInputError ||
      err instanceof ItineraryAgentInputError ||
      err instanceof DiningAgentInputError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "unknown failure";
    return { ok: false, error };
  }
}
