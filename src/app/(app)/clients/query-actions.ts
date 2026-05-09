"use server";

import {
  runCrmQuery,
  CrmQueryError,
  type QueryPlan,
} from "@/lib/ai/agents/crm-query";
import { ProviderConfigError } from "@/lib/ai/registry";
import { getCurrentUserOrThrow } from "@/lib/auth";

export type CrmQueryResult =
  | {
      ok: true;
      plan: QueryPlan;
      rows: Record<string, unknown>[];
    }
  | { ok: false; error: string };

export async function askCrmAction(
  question: string,
): Promise<CrmQueryResult> {
  try {
    const viewer = await getCurrentUserOrThrow();
    const { plan, rows } = await runCrmQuery(question, viewer);
    return {
      ok: true,
      plan,
      rows: rows as unknown as Record<string, unknown>[],
    };
  } catch (err) {
    const error =
      err instanceof CrmQueryError || err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "query failed";
    return { ok: false, error };
  }
}
