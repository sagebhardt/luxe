"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityLog,
  agentLogMessages,
  npsResponses,
  trips,
} from "@/lib/db/schema";
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

const NPS_WINDOW_DAYS = 60;
const NPS_COMMENT_MAX = 2000;

type NpsResult = { ok: true } | { ok: false; error: string };

export async function submitNpsAction(opts: {
  token: string;
  score: number;
  comment: string | null;
}): Promise<NpsResult> {
  if (
    !Number.isInteger(opts.score) ||
    opts.score < 0 ||
    opts.score > 10
  ) {
    return { ok: false, error: "Score must be a whole number from 0 to 10." };
  }

  const tokenRow = await findValidToken(opts.token);
  if (!tokenRow) {
    return { ok: false, error: "Share link is no longer valid." };
  }

  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, tokenRow.tripId))
    .limit(1);
  if (!trip) return { ok: false, error: "Trip not found." };

  /* Window guard mirrors the share page: open from end-of-trip up to
   * NPS_WINDOW_DAYS after, and only if no response yet. */
  if (!trip.endDate) return { ok: false, error: "Trip is not finished yet." };
  const todayIso = new Date().toISOString().slice(0, 10);
  if (todayIso <= trip.endDate) {
    return { ok: false, error: "Survey opens once the trip ends." };
  }
  const daysSinceEnd = Math.round(
    (new Date(todayIso + "T00:00:00").getTime() -
      new Date(trip.endDate + "T00:00:00").getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (daysSinceEnd > NPS_WINDOW_DAYS) {
    return { ok: false, error: "Survey window has closed." };
  }

  const comment = opts.comment?.trim().slice(0, NPS_COMMENT_MAX) || null;

  try {
    await db.insert(npsResponses).values({
      tripId: trip.id,
      clientId: trip.clientId,
      score: opts.score,
      comment,
    });
  } catch (err) {
    /* Unique constraint on trip_id — the form should not have rendered,
     * but treat the duplicate gracefully. */
    void err;
    return { ok: false, error: "We already have your read on this trip." };
  }

  /* Note: clients.nps_score is a 0-100 aggregate (existing seed values
   * are 78/92/94, monitor threshold is < 70). Per-trip raw scores live
   * in nps_responses; we don't overwrite the aggregate here — that's a
   * separate roll-up job. */

  await db.insert(activityLog).values({
    clientId: trip.clientId,
    tripId: trip.id,
    type: "review",
    actor: "system",
    summary: `Post-trip NPS: ${opts.score}/10${comment ? ` — "${comment.slice(0, 140)}${comment.length > 140 ? "…" : ""}"` : ""}`,
    detail: { score: opts.score, comment, source: "share_page" },
  });

  revalidatePath(`/share/trip/${opts.token}`);
  revalidatePath("/clients");
  revalidatePath("/trip");
  return { ok: true };
}
