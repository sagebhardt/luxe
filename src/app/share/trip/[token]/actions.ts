"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentLogMessages } from "@/lib/db/schema";
import { findValidToken } from "@/lib/queries/share";
import { answerClientQuestion } from "@/lib/ai/agents/client-chat";

type Result =
  | {
      ok: true;
      messages: (typeof agentLogMessages.$inferSelect)[];
    }
  | { ok: false; error: string };

export async function sendClientMessageAction(opts: {
  token: string;
  message: string;
}): Promise<Result> {
  const text = opts.message.trim();
  if (!text) return { ok: false, error: "Empty message" };

  const tokenRow = await findValidToken(opts.token);
  if (!tokenRow) {
    return { ok: false, error: "Share link is no longer valid." };
  }

  /* Persist client message immediately */
  await db.insert(agentLogMessages).values({
    tripId: tokenRow.tripId,
    avatar: "client",
    body: escapeHtml(text),
  });

  /* Generate concierge reply */
  let reply: string;
  try {
    reply = await answerClientQuestion({
      tripId: tokenRow.tripId,
      question: text,
    });
  } catch (err) {
    reply =
      "I'll have to check with your concierge and follow up — give them a moment to respond directly.";
    void err;
  }

  await db.insert(agentLogMessages).values({
    tripId: tokenRow.tripId,
    avatar: "orchestrator",
    body: escapeHtml(reply),
  });

  /* Revalidate operator's /trip view so they see new messages */
  revalidatePath("/trip");
  revalidatePath(`/share/trip/${opts.token}`);

  const messages = await db
    .select()
    .from(agentLogMessages)
    .where(eq(agentLogMessages.tripId, tokenRow.tripId))
    .orderBy(asc(agentLogMessages.occurredAt));

  return { ok: true, messages };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
