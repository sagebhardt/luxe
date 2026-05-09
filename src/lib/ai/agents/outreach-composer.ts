import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiInsights, outreachDrafts } from "@/lib/db/schema";
import { resolveAgent } from "@/lib/ai/registry";
import { getClientDetail } from "@/lib/queries/clients";
import type { Viewer } from "@/lib/auth";

/**
 * Outreach Composer
 *
 * Drafts a personalized outreach message for a client, optionally
 * grounded in a specific AI insight (e.g. Next Trip Signal). Persists
 * to outreach_drafts (status='draft'); operator reviews/edits/sends.
 */

export const OutreachSchema = z.object({
  channel: z.enum(["email", "message"]),
  subject: z
    .string()
    .nullable()
    .describe(
      "Subject line for email channel; null for short-form 'message' channel.",
    ),
  body: z
    .string()
    .describe(
      "The actual message. 80-180 words for email, 30-80 words for message. Plain text, no salutation flourishes — operator will personalize the closing.",
    ),
  tone: z.enum(["warm_concierge", "informal", "formal"]),
  reasoning: z
    .string()
    .describe(
      "1 sentence: why this framing/timing for this client. Internal note, never shown to the client.",
    ),
});

export type OutreachOutput = z.infer<typeof OutreachSchema>;

const COMPOSER_SYSTEM_PROMPT = `You are a private travel concierge writing on behalf of the operator. The voice is warm, lightly formal, never salesy. You write English unless the client's profile suggests otherwise.

Hard rules:
- Reference at least one specific fact from the client's history (a trip, a preference, a recent activity). No generic openers.
- Ground the message in the operator's actual relationship with the client. Don't invent shared experiences.
- For email channel, write a clean subject line that hints at the value without leading with the offer.
- Sign off with "—" only; the operator will add their name.`;

export class OutreachAgentError extends Error {}

export async function composeOutreach(
  opts: {
    clientId: string;
    insightId?: string;
    channel?: "email" | "message";
    prompt?: string;
  },
  viewer: Viewer,
) {
  const detail = await getClientDetail(opts.clientId, viewer);
  if (!detail)
    throw new OutreachAgentError(
      `Client ${opts.clientId} not found or not yours`,
    );

  let insight: typeof aiInsights.$inferSelect | null = null;
  if (opts.insightId) {
    insight =
      (await db.query.aiInsights.findFirst({
        where: eq(aiInsights.id, opts.insightId),
      })) ?? null;
  }

  const resolved = await resolveAgent("outreach_composer");

  const { object } = await generateObject({
    model: resolved.model,
    schema: OutreachSchema,
    system: COMPOSER_SYSTEM_PROMPT,
    prompt: buildPrompt(detail, insight, opts),
    temperature: resolved.settings?.temperature ?? 0.6,
  });

  const [draft] = await db
    .insert(outreachDrafts)
    .values({
      clientId: opts.clientId,
      insightId: opts.insightId ?? null,
      channel: object.channel,
      subject: object.subject,
      body: object.body,
      tone: object.tone,
      status: "draft",
    })
    .returning();

  return { draft, output: object };
}

function buildPrompt(
  detail: NonNullable<Awaited<ReturnType<typeof getClientDetail>>>,
  insight: typeof aiInsights.$inferSelect | null,
  opts: { channel?: "email" | "message"; prompt?: string },
) {
  const { client, trips, kpis, activity } = detail;
  const prefs = client.preferences;

  const tripsBlock = trips
    .slice(0, 5)
    .map(
      (t) =>
        `- ${t.name} (${t.destination}) ${t.startDate ?? "?"} → ${t.endDate ?? "?"} · ${t.status}`,
    )
    .join("\n");

  const recent = activity
    .slice(0, 5)
    .map(
      (a) =>
        `- [${a.occurredAt instanceof Date ? a.occurredAt.toISOString().slice(0, 10) : String(a.occurredAt).slice(0, 10)}] ${a.type}: ${stripTags(a.summary)}`,
    )
    .join("\n");

  const prefsBlock = prefs
    ? [
        prefs.flightClass && `flightClass: ${prefs.flightClass}`,
        prefs.hotelStyle && `hotelStyle: ${prefs.hotelStyle}`,
        prefs.diningStyle && `dining: ${prefs.diningStyle}`,
        prefs.preferredDestinations?.length &&
          `interests: ${prefs.preferredDestinations.join(", ")}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "—";

  return [
    `Client: ${client.name} (${client.tag})`,
    `LTV: $${(kpis.lifetimeValueCents / 100).toLocaleString("en-US")}  ·  NPS: ${kpis.npsScore ?? "—"}`,
    `Notes: ${client.notes ?? "—"}`,
    `Preferences: ${prefsBlock}`,
    "",
    `Recent trips:`,
    tripsBlock || "(none)",
    "",
    `Recent activity:`,
    recent || "(none)",
    "",
    insight
      ? `Insight to ground the outreach in (kind=${insight.kind}):\n${stripTags(insight.body)}`
      : "No specific insight — write a thoughtful general check-in tied to a fact from history.",
    "",
    opts.prompt ? `Operator hint: ${opts.prompt}` : "",
    "",
    `Preferred channel: ${opts.channel ?? "email"}`,
    "",
    "Draft the outreach. Cite a specific fact from above. Keep it short, warm, no sales pitch.",
  ]
    .filter(Boolean)
    .join("\n");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}
