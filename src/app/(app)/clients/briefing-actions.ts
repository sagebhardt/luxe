"use server";

import {
  prepareClientBriefing,
  BriefingAgentError,
  type ClientBriefingOutput,
} from "@/lib/ai/agents/client-briefing";
import { ProviderConfigError } from "@/lib/ai/registry";

export type PrepareBriefingResult =
  | { ok: true; briefing: ClientBriefingOutput }
  | { ok: false; error: string };

export async function prepareBriefingAction(
  clientId: string,
): Promise<PrepareBriefingResult> {
  try {
    const briefing = await prepareClientBriefing(clientId);
    return { ok: true, briefing };
  } catch (err) {
    const error =
      err instanceof BriefingAgentError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "unknown failure";
    return { ok: false, error };
  }
}
