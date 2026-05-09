import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  trips,
  clients,
  travelerPreferences,
  bookings,
} from "@/lib/db/schema";
import { runAgent, type AgentRunResult } from "@/lib/ai/runner";

/**
 * Itinerary Agent
 *
 * Pure synthesis — no external data source. The model's training is
 * sufficient to suggest plausible day-by-day plans for known
 * destinations. Output is presented as proposals; the operator
 * approves before they become bookings.
 */

export const ItineraryAgentSchema = z.object({
  days: z
    .array(
      z.object({
        date: z.string().describe("ISO yyyy-mm-dd"),
        events: z
          .array(
            z.object({
              time: z
                .string()
                .describe("HH:mm or '—' if flexible"),
              icon: z.string().describe("single emoji"),
              title: z.string(),
              detail: z.string(),
              estCostCents: z.number().int().optional(),
            }),
          )
          .min(1)
          .max(5),
      }),
    )
    .min(1),
  notes: z
    .string()
    .describe("1–2 sentences on the routing logic / crowd considerations"),
});

export type ItineraryAgentOutput = z.infer<typeof ItineraryAgentSchema>;

export class ItineraryAgentInputError extends Error {}

export async function runItineraryAgent(
  tripId: string,
): Promise<AgentRunResult<ItineraryAgentOutput>> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      client: { with: { preferences: true } },
      bookings: true,
    },
  });
  if (!trip) throw new ItineraryAgentInputError(`Trip ${tripId} not found`);
  if (!trip.startDate || !trip.endDate) {
    throw new ItineraryAgentInputError(
      `Trip ${tripId} has no startDate/endDate.`,
    );
  }

  return runAgent<ItineraryAgentOutput>({
    agent: "itinerary",
    tripId,
    headline: `Drafting itinerary for ${trip.destination}`,
    outputSchema: ItineraryAgentSchema,
    buildPrompt: () => buildPrompt(trip),
    toDecision: (output) => ({
      headline: `${output.days.length}-day plan for ${trip.destination}`,
      rationale: output.notes,
      recommendation: {
        days: output.days,
        notes: output.notes,
      },
    }),
    toLog: (output) => [
      {
        avatar: "sub_agent",
        body: `Itinerary agent: drafted <em>${output.days.length} days</em> in ${trip.destination}. ${output.notes}`,
      },
    ],
  });
}

function buildPrompt(
  trip: typeof trips.$inferSelect & {
    client: typeof clients.$inferSelect & {
      preferences: typeof travelerPreferences.$inferSelect | null;
    };
    bookings: (typeof bookings.$inferSelect)[];
  },
) {
  const prefs = trip.client.preferences;
  const fixed = trip.bookings
    .filter((b) => b.occursOn)
    .map((b) => {
      const meta = (b.metadata ?? {}) as { time?: string; icon?: string };
      return `${b.occursOn} ${meta.time ?? "—"} · ${meta.icon ?? "•"} ${b.title}`;
    })
    .join("\n");

  const prefsLine =
    [
      prefs?.pacePreference && `pace: ${prefs.pacePreference}`,
      prefs?.diningStyle && `dining: ${prefs.diningStyle}`,
      prefs?.preferredDestinations?.length &&
        `interests: ${prefs.preferredDestinations.join(", ")}`,
    ]
      .filter(Boolean)
      .join(" · ") || "no specific preferences on file";

  return [
    `Traveler: ${trip.client.name}`,
    `Preferences: ${prefsLine}`,
    `Trip: ${trip.name} — ${trip.destination}`,
    `Dates: ${trip.startDate} → ${trip.endDate}`,
    `Travelers: ${trip.travelerCount}`,
    "",
    fixed
      ? `Already-anchored bookings (work the day plan around these):\n${fixed}`
      : "No bookings anchored yet.",
    "",
    "Draft a day-by-day itinerary as a structured object. Each day has events with time (HH:mm or '—'), an emoji icon, a short title, and a 1-line detail. Aim for 2–4 events/day; respect crowd calendars and the traveler's stated pace. Keep it factually grounded in well-known places at the destination — do not invent fictional venues. Provide a short routing-logic note at the end.",
  ]
    .filter(Boolean)
    .join("\n");
}
