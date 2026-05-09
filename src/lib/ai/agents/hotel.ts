import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trips, clients, travelerPreferences } from "@/lib/db/schema";
import { resolveCoords } from "@/lib/data/city-coords";
import {
  type DuffelStayResult,
  searchStays,
  DuffelError,
} from "@/lib/data/duffel";
import { runAgent, type AgentRunResult } from "@/lib/ai/runner";

export const HotelAgentSchema = z.object({
  topPick: z.object({
    accommodationId: z.string(),
    name: z.string(),
    rationale: z.string(),
    priceCents: z.number().int(),
    nightsTotal: z.number().int(),
  }),
  alternatives: z
    .array(
      z.object({
        accommodationId: z.string(),
        name: z.string(),
        priceCents: z.number().int(),
        note: z.string(),
      }),
    )
    .max(3),
  preferenceMatch: z.string(),
});

export type HotelAgentOutput = z.infer<typeof HotelAgentSchema>;

export class HotelAgentInputError extends Error {}

export async function runHotelAgent(
  tripId: string,
): Promise<AgentRunResult<HotelAgentOutput>> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: { client: { with: { preferences: true } } },
  });
  if (!trip) throw new HotelAgentInputError(`Trip ${tripId} not found`);
  if (!trip.startDate || !trip.endDate) {
    throw new HotelAgentInputError(
      `Trip ${tripId} has no startDate/endDate.`,
    );
  }

  const coords = resolveCoords(trip.destination);
  if (!coords) {
    throw new HotelAgentInputError(
      `Couldn't resolve "${trip.destination}" to coordinates. Add to city-coords.ts.`,
    );
  }
  const nights = Math.max(
    1,
    Math.round(
      (new Date(trip.endDate).getTime() -
        new Date(trip.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  let stays: DuffelStayResult[];
  try {
    stays = await searchStays(
      {
        check_in_date: trip.startDate,
        check_out_date: trip.endDate,
        rooms: 1,
        guests: trip.travelerCount,
        location: {
          radius: 15,
          geographic_coordinates: {
            latitude: coords.lat,
            longitude: coords.lng,
          },
        },
      },
      { limit: 8 },
    );
  } catch (err) {
    if (err instanceof DuffelError) {
      throw new HotelAgentInputError(
        `Duffel stays search failed (${err.status}): ${truncate(String(err.body), 240)}`,
      );
    }
    throw err;
  }

  if (stays.length === 0) {
    throw new HotelAgentInputError(
      `Duffel returned no stays for ${trip.destination}. Test data is curated — try a supported city.`,
    );
  }

  return runAgent<HotelAgentOutput>({
    agent: "hotel",
    tripId,
    headline: `Searching hotels in ${trip.destination} for ${nights} night${nights === 1 ? "" : "s"}`,
    outputSchema: HotelAgentSchema,
    buildPrompt: () => buildPrompt(trip, stays, nights),
    toDecision: (output) => ({
      headline: output.topPick.name,
      rationale: output.topPick.rationale,
      recommendation: {
        accommodationId: output.topPick.accommodationId,
        nightsTotal: output.topPick.nightsTotal,
        priceCents: output.topPick.priceCents,
        preferenceMatch: output.preferenceMatch,
      },
      alternatives: output.alternatives.map((a) => ({
        accommodationId: a.accommodationId,
        name: a.name,
        priceCents: a.priceCents,
        note: a.note,
      })),
    }),
    toLog: (output) => [
      {
        avatar: "sub_agent",
        body: `Hotel agent: ranked ${stays.length} properties, recommends <em>${output.topPick.name}</em>. ${output.preferenceMatch}`,
      },
    ],
  });
}

function buildPrompt(
  trip: typeof trips.$inferSelect & {
    client: typeof clients.$inferSelect & {
      preferences: typeof travelerPreferences.$inferSelect | null;
    };
  },
  stays: DuffelStayResult[],
  nights: number,
) {
  const prefs = trip.client.preferences;
  const prefsLine =
    [
      prefs?.hotelStyle && `style: ${prefs.hotelStyle}`,
      prefs?.pacePreference && `pace: ${prefs.pacePreference}`,
      prefs?.diningStyle && `dining: ${prefs.diningStyle}`,
    ]
      .filter(Boolean)
      .join(" · ") || "no specific preferences on file";

  const block = stays
    .map((r, i) => {
      const a = r.accommodation;
      return [
        `[${i + 1}] accommodationId=${a.id}`,
        `    name: ${a.name}`,
        a.chain?.name && `    chain: ${a.chain.name}`,
        a.rating && `    rating: ${a.rating}`,
        a.review_score && `    review: ${a.review_score}`,
        a.location?.address?.line_one &&
          `    address: ${a.location.address.line_one}`,
        `    nightly avg: ${r.cheapest_rate_currency} ${(Number(r.cheapest_rate_total_amount) / nights).toFixed(2)} (total: ${r.cheapest_rate_currency} ${r.cheapest_rate_total_amount})`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    `Traveler: ${trip.client.name}`,
    `Preferences: ${prefsLine}`,
    `Trip: ${trip.name} — ${trip.destination}`,
    `Stay: ${trip.startDate} → ${trip.endDate} (${nights} night${nights === 1 ? "" : "s"}), ${trip.travelerCount} guest${trip.travelerCount === 1 ? "" : "s"}`,
    trip.budgetCents
      ? `Total trip budget: $${(trip.budgetCents / 100).toLocaleString("en-US")}`
      : null,
    "",
    "Available accommodations (sorted by total price asc):",
    block,
    "",
    "Score these against the preferences. Boutique-style or independent properties should outweigh chain hotels when the traveler prefers boutique. Return a structured top pick (accommodationId, name, rationale, priceCents=total, nightsTotal), up to 3 alternatives, and a one-sentence preferenceMatch summary. priceCents must be the total stay price in cents (multiply total_amount by 100, rounded). Use accommodationIds verbatim from the list — do not invent any.",
  ]
    .filter(Boolean)
    .join("\n");
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
