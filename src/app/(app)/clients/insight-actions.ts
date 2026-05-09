"use server";

import { revalidatePath } from "next/cache";
import {
  regenerateClientInsights,
  InsightsAgentError,
} from "@/lib/ai/agents/client-insights";
import { ProviderConfigError } from "@/lib/ai/registry";

export type RegenInsightsResult =
  | { ok: true }
  | { ok: false; error: string };

export async function regenerateInsightsAction(
  clientId: string,
): Promise<RegenInsightsResult> {
  try {
    await regenerateClientInsights(clientId);
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    const error =
      err instanceof InsightsAgentError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "unknown failure";
    return { ok: false, error };
  }
}
