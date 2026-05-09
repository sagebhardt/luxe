import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiInsights } from "@/lib/db/schema";
import { resolveAgent } from "@/lib/ai/registry";
import { getClientDetail } from "@/lib/queries/clients";

/**
 * Client Insights Generator
 *
 * Reads a client's full picture (profile, preferences, every trip,
 * agent decisions, activity log) and produces three structured
 * insight cards: Next Trip Signal, Spend Pattern, Risk Flag.
 *
 * Replaces existing ai_insights rows for the client atomically
 * (delete + bulk insert). No agent_runs row — these are stateless
 * regenerations from the operator's POV.
 */

export const ClientInsightsSchema = z.object({
  insights: z
    .array(
      z.object({
        kind: z.enum(["next_trip_signal", "spend_pattern", "risk_flag"]),
        body: z
          .string()
          .describe(
            "1–3 sentences. Use <strong> for facts (e.g. dollar values, dates) and <em> for emphasis (a specific recommendation or call to action). No markdown.",
          ),
        sortOrder: z.number().int().min(0).max(2),
      }),
    )
    .length(3),
});

export type ClientInsightsOutput = z.infer<typeof ClientInsightsSchema>;

const INSIGHTS_SYSTEM_PROMPT = `You are a senior travel concierge generating intelligence cards about a private client. Your output is read by the operator to decide who to reach out to and when.

For each insight kind:
- next_trip_signal — predict the *next* trip the client is likely to take, by destination type and time window. Tie it to actual past behavior (seasonality, cadence, returning destinations). Recommend an outreach date when possible.
- spend_pattern — describe how the client's spending is changing across trips. Concrete numbers from history. Identify upgrade behavior, ceilings, and category-level deltas.
- risk_flag — surface a relationship risk: dormancy, missing referrals despite high NPS, partner-only trips, single-channel reliance, anything the operator should act on.

Tone: precise, warm, operator-friendly. Use <strong> for key facts and <em> for the action/recommendation. No markdown. Keep each card to 1–3 sentences.`;

export class InsightsAgentError extends Error {}

export async function regenerateClientInsights(clientId: string) {
  const detail = await getClientDetail(clientId);
  if (!detail) {
    throw new InsightsAgentError(`Client ${clientId} not found`);
  }

  const resolved = await resolveAgent("client_insights");

  const { object } = await generateObject({
    model: resolved.model,
    schema: ClientInsightsSchema,
    system: INSIGHTS_SYSTEM_PROMPT,
    prompt: buildPrompt(detail),
    temperature: resolved.settings?.temperature ?? 0.5,
  });

  /* Atomic-ish replace: delete then insert. neon-http can't do a true
   * transaction over a single HTTP request, so a brief gap is possible —
   * acceptable for a regenerate flow. */
  await db.delete(aiInsights).where(eq(aiInsights.clientId, clientId));
  await db.insert(aiInsights).values(
    object.insights.map((i) => ({
      clientId,
      kind: i.kind,
      body: i.body,
      sortOrder: i.sortOrder,
    })),
  );

  return object;
}

function buildPrompt(
  detail: NonNullable<Awaited<ReturnType<typeof getClientDetail>>>,
) {
  const { client, trips, activity, kpis } = detail;
  const prefs = client.preferences;

  const tripsBlock = trips
    .map((t) => {
      const valueUsd = t.budgetCents ? `$${(t.budgetCents / 100).toLocaleString("en-US")}` : "—";
      return [
        `- ${t.name} (${t.destination})`,
        `  status: ${t.status}`,
        `  dates: ${t.startDate ?? "?"} → ${t.endDate ?? "?"}`,
        `  travelers: ${t.travelerCount}`,
        `  value: ${valueUsd}`,
      ].join("\n");
    })
    .join("\n");

  const activityBlock = activity
    .slice(0, 8)
    .map((a) => {
      const when = a.occurredAt instanceof Date ? a.occurredAt : new Date(a.occurredAt);
      return `- [${when.toISOString().slice(0, 10)}] ${a.type} (${a.actor ?? "system"}): ${stripTags(a.summary)}`;
    })
    .join("\n");

  const prefsBlock = prefs
    ? [
        prefs.flightClass && `flightClass: ${prefs.flightClass}`,
        prefs.seatPreference && `seat: ${prefs.seatPreference}`,
        prefs.hotelStyle && `hotelStyle: ${prefs.hotelStyle}`,
        prefs.diningStyle && `dining: ${prefs.diningStyle}`,
        prefs.pacePreference && `pace: ${prefs.pacePreference}`,
        prefs.preferredDestinations?.length &&
          `interests: ${prefs.preferredDestinations.join(", ")}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "no preferences on file";

  return [
    `Client: ${client.name}`,
    `Tag: ${client.tag}`,
    `NPS: ${kpis.npsScore ?? "—"}`,
    `Lifetime value: $${(kpis.lifetimeValueCents / 100).toLocaleString("en-US")}`,
    `Trips completed: ${kpis.tripsCount}  ·  avg/year: ${kpis.avgPerYear}  ·  avg trip value: $${(kpis.avgTripValueCents / 100).toLocaleString("en-US")}`,
    `Notes: ${client.notes ?? "—"}`,
    `Preferences: ${prefsBlock}`,
    "",
    `Trip history (${trips.length}):`,
    tripsBlock || "(none)",
    "",
    `Recent activity:`,
    activityBlock || "(none)",
    "",
    "Generate exactly 3 insights — one per kind (next_trip_signal sortOrder=0, spend_pattern sortOrder=1, risk_flag sortOrder=2). Cite specific facts from above. Recommend concrete operator actions (when to reach out, what to offer, whom to introduce).",
  ].join("\n");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}
