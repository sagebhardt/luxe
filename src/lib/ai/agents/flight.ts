import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trips, clients, travelerPreferences } from "@/lib/db/schema";
import { resolveIata } from "@/lib/data/airport-codes";
import {
  type DuffelOffer,
  searchOffers,
  DuffelError,
} from "@/lib/data/duffel";
import { runAgent, type AgentRunResult } from "@/lib/ai/runner";

/**
 * Flight Agent
 *
 * 1. Pulls trip + client preferences from DB.
 * 2. Resolves origin/destination IATA codes from free-text city names.
 * 3. Searches Duffel for live offers.
 * 4. Asks Gemini (via the registry) to score offers against traveler
 *    preferences and return a structured top-pick + alternatives.
 * 5. Persists an agent_run + agent_decision via the runner.
 *
 * If Duffel returns zero offers (test data is curated), the agent
 * surfaces that and stops without inventing fares.
 */

export const FlightAgentSchema = z.object({
  topPick: z.object({
    offerId: z.string().describe("The Duffel offer.id of the recommended option"),
    headline: z
      .string()
      .describe('Short label, e.g. "JAL 61 (SCL→NRT, Business)"'),
    rationale: z
      .string()
      .describe(
        "1–2 sentences justifying this pick against the traveler's stated preferences",
      ),
    priceCents: z.number().int().describe("Total price in cents"),
    cabin: z.string(),
    carrier: z.string(),
  }),
  alternatives: z
    .array(
      z.object({
        offerId: z.string(),
        headline: z.string(),
        priceCents: z.number().int(),
        note: z.string().describe("Why this is a runner-up vs the top pick"),
      }),
    )
    .max(3),
  preferenceMatch: z
    .string()
    .describe(
      "One sentence on how the top pick aligns with the traveler's seat/class/timing preferences",
    ),
});

export type FlightAgentOutput = z.infer<typeof FlightAgentSchema>;

export class FlightAgentInputError extends Error {}

export async function runFlightAgent(
  tripId: string,
  options?: { originHint?: string },
): Promise<AgentRunResult<FlightAgentOutput>> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: {
      client: { with: { preferences: true } },
    },
  });
  if (!trip) throw new FlightAgentInputError(`Trip ${tripId} not found`);
  if (!trip.startDate) {
    throw new FlightAgentInputError(
      `Trip ${tripId} has no startDate — set one before running Flight Agent.`,
    );
  }

  // Resolve origin: prefer explicit hint, then preferences, then client notes.
  const originHint =
    options?.originHint ?? extractOrigin(trip.client) ?? "Santiago";
  const origin = resolveIata(originHint);
  const destination = resolveIata(trip.destination);
  if (!origin) {
    throw new FlightAgentInputError(
      `Couldn't resolve origin "${originHint}" to an airport. Add to airport-codes.ts or pass originHint.`,
    );
  }
  if (!destination) {
    throw new FlightAgentInputError(
      `Couldn't resolve destination "${trip.destination}" to an airport.`,
    );
  }

  const cabinClass = mapCabinClass(trip.client.preferences?.flightClass);

  let offers: DuffelOffer[];
  try {
    offers = await searchOffers({
      slices: [
        {
          origin,
          destination,
          departure_date: trip.startDate,
        },
      ],
      passengers: Array.from({ length: trip.travelerCount }, () => ({
        type: "adult" as const,
      })),
      cabin_class: cabinClass,
    });
  } catch (err) {
    if (err instanceof DuffelError) {
      throw new FlightAgentInputError(
        `Duffel search failed (${err.status}): ${truncate(String(err.body), 240)}`,
      );
    }
    throw err;
  }

  if (offers.length === 0) {
    throw new FlightAgentInputError(
      `Duffel returned no offers for ${origin} → ${destination} on ${trip.startDate}. Test mode is curated — try Tokyo (NRT) or rebook with a Duffel-supported route.`,
    );
  }

  return runAgent<FlightAgentOutput>({
    agent: "flight",
    tripId,
    headline: `Searching ${origin} → ${destination} for ${trip.startDate}`,
    outputSchema: FlightAgentSchema,
    buildPrompt: () => buildPrompt(trip, offers, origin, destination),
    toDecision: (output) => ({
      headline: output.topPick.headline,
      rationale: output.topPick.rationale,
      recommendation: {
        offerId: output.topPick.offerId,
        carrier: output.topPick.carrier,
        cabin: output.topPick.cabin,
        priceCents: output.topPick.priceCents,
        preferenceMatch: output.preferenceMatch,
      },
      alternatives: output.alternatives.map((a) => ({
        offerId: a.offerId,
        headline: a.headline,
        priceCents: a.priceCents,
        note: a.note,
      })),
    }),
    toLog: (output) => [
      {
        avatar: "sub_agent",
        body: `Flight agent: scored ${offers.length} offers, recommends <em>${output.topPick.headline}</em>. ${output.preferenceMatch}`,
      },
    ],
  });
}

function extractOrigin(client: typeof clients.$inferSelect): string | null {
  if (client.notes) {
    const first = client.notes.split("·")[0]?.trim();
    if (first) return first;
  }
  return null;
}

function mapCabinClass(
  pref: string | null | undefined,
): "economy" | "premium_economy" | "business" | "first" | undefined {
  switch (pref) {
    case "first":
      return "first";
    case "business":
      return "business";
    case "premium":
    case "premium_economy":
      return "premium_economy";
    case "economy":
      return "economy";
    default:
      return undefined;
  }
}

function buildPrompt(
  trip: typeof trips.$inferSelect & {
    client: typeof clients.$inferSelect & {
      preferences: typeof travelerPreferences.$inferSelect | null;
    };
  },
  offers: DuffelOffer[],
  origin: string,
  destination: string,
) {
  const prefs = trip.client.preferences;
  const prefsLine = [
    prefs?.flightClass && `cabin: ${prefs.flightClass}`,
    prefs?.seatPreference && `seat: ${prefs.seatPreference}`,
    prefs?.pacePreference && `pace: ${prefs.pacePreference}`,
    prefs?.diningStyle && `dining: ${prefs.diningStyle}`,
  ]
    .filter(Boolean)
    .join(" · ") || "no specific preferences on file";

  const offersBlock = offers
    .map((o, i) => {
      const seg = o.slices[0]?.segments[0];
      const lastSeg =
        o.slices[0]?.segments[o.slices[0]?.segments.length - 1];
      return [
        `[${i + 1}] offerId=${o.id}`,
        `    carrier: ${o.owner.name ?? o.owner.iata_code}`,
        seg &&
          `    departs: ${seg.origin.iata_code} ${seg.departing_at}`,
        lastSeg &&
          `    arrives: ${lastSeg.destination.iata_code} ${lastSeg.arriving_at}`,
        `    cabin: ${o.cabin_class ?? "—"}`,
        `    duration: ${o.slices[0]?.duration ?? "—"}`,
        `    segments: ${o.slices[0]?.segments.length ?? 0}`,
        `    price: ${o.total_currency} ${o.total_amount}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    `Traveler: ${trip.client.name}`,
    `Preferences: ${prefsLine}`,
    `Trip: ${trip.name} — ${trip.destination}`,
    `Route: ${origin} → ${destination} on ${trip.startDate}`,
    `Travelers: ${trip.travelerCount}`,
    trip.budgetCents
      ? `Total trip budget: $${(trip.budgetCents / 100).toLocaleString("en-US")}`
      : null,
    "",
    "Available offers (sorted ascending by price):",
    offersBlock,
    "",
    "Score these against the preferences above. Return a structured top pick (offerId, headline, rationale, priceCents, cabin, carrier), up to 3 alternatives, and a one-sentence summary of how the top pick matches the traveler's stated preferences. Use offerIds verbatim from the list — do not invent any. priceCents must equal the price you cite (multiply the total_amount by 100, rounded).",
  ]
    .filter(Boolean)
    .join("\n");
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
