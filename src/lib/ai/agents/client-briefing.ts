import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentDecisions,
  trips,
} from "@/lib/db/schema";
import { resolveAgent } from "@/lib/ai/registry";
import { getClientDetail } from "@/lib/queries/clients";
import type { Viewer } from "@/lib/auth";

/**
 * Pre-Call Briefing Generator
 *
 * Assembles a one-page briefing the operator can read before a call:
 *   - 2-line overview tying the client to current state
 *   - active trip status (if any)
 *   - open decisions across all their trips (pending_approval)
 *   - 3–5 talking points based on history + preferences + recent activity
 *   - watch-outs the operator shouldn't miss
 *
 * Ephemeral — not persisted. Generate, render, dismiss.
 */

export const ClientBriefingSchema = z.object({
  overview: z
    .string()
    .describe(
      "2 sentences: what the operator should know in 5 seconds.",
    ),
  activeTripStatus: z
    .string()
    .nullable()
    .describe(
      "If the client has an active trip, summarize where it stands (anchored bookings, pending decisions, alerts). Null if no active trip.",
    ),
  openItems: z
    .array(
      z.object({
        title: z.string(),
        urgency: z.enum(["high", "medium", "low"]),
        note: z.string(),
      }),
    )
    .describe(
      "Things that need a decision or response from the client. Include pending agent decisions, unsent briefs, expiring inventory.",
    ),
  talkingPoints: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe(
      "Conversational hooks the operator can use on the call. Specific to this client's history — not generic.",
    ),
  watchOuts: z
    .array(z.string())
    .max(3)
    .describe(
      "Subtle landmines: avoid the chain hotel topic, dietary restriction the client cares about, recent NPS hit, etc.",
    ),
});

export type ClientBriefingOutput = z.infer<typeof ClientBriefingSchema>;

export class BriefingAgentError extends Error {}

const BRIEFING_SYSTEM_PROMPT = `You are a senior travel concierge preparing a 60-second pre-call briefing for a colleague who is about to speak with this client. Your goal is to make the colleague feel as informed as the primary handler.

Be specific. Cite actual destinations, dates, dollar amounts, and named events from the data. Skip generic statements ("loves quality"). The operator already knows the client exists — give them the *edge*: what to bring up, what to soft-pedal, what just changed.`;

export async function prepareClientBriefing(
  clientId: string,
  viewer: Viewer,
) {
  const detail = await getClientDetail(clientId, viewer);
  if (!detail)
    throw new BriefingAgentError(`Client ${clientId} not found or not yours`);

  /* Pull pending decisions across the client's trips */
  const tripIds = detail.trips.map((t) => t.id);
  const pendingDecisions = tripIds.length
    ? await db.query.agentDecisions.findMany({
        where: (t, { and, eq, inArray }) =>
          and(
            inArray(agentDecisions.tripId, tripIds),
            eq(agentDecisions.status, "pending_approval"),
          ),
      })
    : [];

  const activeTrip = detail.trips.find(
    (t) => t.status === "active" || t.status === "pending",
  );
  const activeTripBookings = activeTrip
    ? await db.query.bookings.findMany({
        where: (b, { eq }) => eq(b.tripId, activeTrip.id),
      })
    : [];

  const resolved = await resolveAgent("client_briefing");

  const { object } = await generateObject({
    model: resolved.model,
    schema: ClientBriefingSchema,
    system: BRIEFING_SYSTEM_PROMPT,
    prompt: buildPrompt(detail, pendingDecisions, activeTrip, activeTripBookings),
    temperature: resolved.settings?.temperature ?? 0.4,
  });

  return object;
}

function buildPrompt(
  detail: NonNullable<Awaited<ReturnType<typeof getClientDetail>>>,
  pendingDecisions: (typeof agentDecisions.$inferSelect)[],
  activeTrip: typeof trips.$inferSelect | undefined,
  activeTripBookings: { kind: string; title: string; status: string }[],
) {
  const { client, trips: clientTrips, activity, kpis } = detail;
  const prefs = client.preferences;

  const tripsBlock = clientTrips
    .map((t) => {
      const v = t.budgetCents
        ? `$${(t.budgetCents / 100).toLocaleString("en-US")}`
        : "—";
      return `- ${t.name} (${t.destination}) ${t.startDate ?? "?"} → ${t.endDate ?? "?"} · ${t.status} · ${v}`;
    })
    .join("\n");

  const decisionsBlock = pendingDecisions
    .map(
      (d) =>
        `- [${d.agent}] ${d.headline}${d.rationale ? ` — ${d.rationale}` : ""}`,
    )
    .join("\n");

  const activityBlock = activity
    .slice(0, 10)
    .map(
      (a) =>
        `- [${a.occurredAt instanceof Date ? a.occurredAt.toISOString().slice(0, 10) : String(a.occurredAt).slice(0, 10)}] ${a.type} (${a.actor ?? "system"}): ${stripTags(a.summary)}`,
    )
    .join("\n");

  const activeBlock = activeTrip
    ? [
        `Active trip: ${activeTrip.name} (${activeTrip.destination})`,
        `  status: ${activeTrip.status}`,
        `  dates: ${activeTrip.startDate} → ${activeTrip.endDate}`,
        `  travelers: ${activeTrip.travelerCount}`,
        `  budget: ${activeTrip.budgetCents ? `$${(activeTrip.budgetCents / 100).toLocaleString("en-US")}` : "—"}`,
        `  committed: ${activeTrip.committedCents ? `$${(activeTrip.committedCents / 100).toLocaleString("en-US")}` : "—"}`,
        `  bookings:`,
        ...activeTripBookings.map(
          (b) => `    - [${b.kind}] ${b.title} · ${b.status}`,
        ),
      ].join("\n")
    : "No active trip.";

  const prefsBlock = prefs
    ? [
        prefs.flightClass && `flightClass: ${prefs.flightClass}`,
        prefs.seatPreference && `seat: ${prefs.seatPreference}`,
        prefs.hotelStyle && `hotelStyle: ${prefs.hotelStyle}`,
        prefs.diningStyle && `dining: ${prefs.diningStyle}`,
        prefs.pacePreference && `pace: ${prefs.pacePreference}`,
        prefs.dietaryRestrictions?.length &&
          `dietary: ${prefs.dietaryRestrictions.join(", ")}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "—";

  return [
    `Client: ${client.name} (${client.tag.toUpperCase()})`,
    `NPS: ${kpis.npsScore ?? "—"}  ·  LTV: $${(kpis.lifetimeValueCents / 100).toLocaleString("en-US")}`,
    `Notes: ${client.notes ?? "—"}`,
    `Preferences: ${prefsBlock}`,
    "",
    activeBlock,
    "",
    `Pending decisions across all trips: ${pendingDecisions.length}`,
    decisionsBlock || "(none)",
    "",
    `Trip history:`,
    tripsBlock || "(none)",
    "",
    `Recent activity:`,
    activityBlock || "(none)",
    "",
    "Generate the briefing as a structured object. Talking points must be tied to specific facts above. Watch-outs should be subtle — not obvious things the operator already knows.",
  ].join("\n");
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}
