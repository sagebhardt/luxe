"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { outreachDrafts } from "@/lib/db/schema";
import {
  composeOutreach,
  OutreachAgentError,
} from "@/lib/ai/agents/outreach-composer";
import { ProviderConfigError } from "@/lib/ai/registry";

type Result =
  | { ok: true; draftId: string }
  | { ok: false; error: string };

export async function composeOutreachAction(opts: {
  clientId: string;
  insightId?: string;
  channel?: "email" | "message";
}): Promise<Result> {
  try {
    const { draft } = await composeOutreach(opts);
    revalidatePath("/clients");
    return { ok: true, draftId: draft.id };
  } catch (err) {
    const error =
      err instanceof OutreachAgentError ||
      err instanceof ProviderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "compose failed";
    return { ok: false, error };
  }
}

export async function updateDraftBodyAction(
  draftId: string,
  body: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!body.trim()) return { ok: false, error: "Body cannot be empty" };
  try {
    await db
      .update(outreachDrafts)
      .set({ body })
      .where(eq(outreachDrafts.id, draftId));
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "update failed",
    };
  }
}

export async function markDraftSentAction(
  draftId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await db
      .update(outreachDrafts)
      .set({ status: "sent", sentAt: new Date() })
      .where(eq(outreachDrafts.id, draftId));
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "mark sent failed",
    };
  }
}

export async function discardDraftAction(
  draftId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await db
      .update(outreachDrafts)
      .set({ status: "discarded" })
      .where(eq(outreachDrafts.id, draftId));
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "discard failed",
    };
  }
}
