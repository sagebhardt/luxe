"use server";

import { revalidatePath } from "next/cache";
import { updateClientStage } from "@/lib/queries/pipeline";
import { STAGES, type Stage } from "@/lib/pipeline";
import {
  AuthError,
  assertOwnsClient,
  getCurrentUserOrThrow,
} from "@/lib/auth";

type Result = { ok: true } | { ok: false; error: string };

export async function updateClientStageAction(
  clientId: string,
  stage: Stage,
): Promise<Result> {
  if (!STAGES.includes(stage))
    return { ok: false, error: `Unknown stage: ${stage}` };
  if (!clientId) return { ok: false, error: "clientId required" };
  try {
    const viewer = await getCurrentUserOrThrow();
    await assertOwnsClient(clientId, viewer);
    await updateClientStage(clientId, stage);
    revalidatePath("/pipeline");
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : "update failed",
    };
  }
}
