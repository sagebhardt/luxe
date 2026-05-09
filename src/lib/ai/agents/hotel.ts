import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trips, clients, travelerPreferences } from "@/lib/db/schema";
import { findHotelsForCity, type HotelOption } from "@/lib/data/hotels-catalog";
import { runAgent, type AgentRunResult } from "@/lib/ai/runner";
import {
  suggestSuppliersForAgent,
  type SupplierRow,
} from "@/lib/queries/suppliers";

/**
 * Hotel Agent
 *
 * Uses an in-house curated catalog of boutique-luxury hotels per city
 * (src/lib/data/hotels-catalog.ts) since Duffel Stays is a paid tier
 * and free hotel APIs (Booking, Hotelbeds) gate on partner approval.
 *
 * Same scoring pattern as Flight Agent — Gemini ranks options against
 * the traveler's stated preferences and produces a structured top-pick
 * + alternatives. Swap the data layer when real inventory is wired up.
 */

export const HotelAgentSchema = z.object({
  topPick: z.object({
    hotelId: z.string(),
    name: z.string(),
    rationale: z.string(),
    nightlyCents: z.number().int(),
    totalCents: z.number().int(),
    nightsTotal: z.number().int(),
  }),
  alternatives: z
    .array(
      z.object({
        hotelId: z.string(),
        name: z.string(),
        nightlyCents: z.number().int(),
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
    throw new HotelAgentInputError(`Trip ${tripId} has no startDate/endDate.`);
  }

  const hotels = findHotelsForCity(trip.destination);
  if (hotels.length === 0) {
    throw new HotelAgentInputError(
      `No hotels in catalog for "${trip.destination}". Add entries to src/lib/data/hotels-catalog.ts.`,
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

  /* Odylic's curated short list of preferred hotels in this destination.
   * Pushed into the prompt as authoritative context so the agent
   * surfaces them first when scoring matches. */
  const preferred = await suggestSuppliersForAgent({
    kind: "hotel",
    destination: trip.destination,
    limit: 5,
  });

  return runAgent<HotelAgentOutput>({
    agent: "hotel",
    tripId,
    headline: `Ranking ${hotels.length} hotels in ${trip.destination}`,
    outputSchema: HotelAgentSchema,
    buildPrompt: () => buildPrompt(trip, hotels, nights, preferred),
    toDecision: (output) => ({
      headline: output.topPick.name,
      rationale: output.topPick.rationale,
      recommendation: {
        hotelId: output.topPick.hotelId,
        nightlyCents: output.topPick.nightlyCents,
        priceCents: output.topPick.totalCents,
        nightsTotal: output.topPick.nightsTotal,
        preferenceMatch: output.preferenceMatch,
      },
      alternatives: output.alternatives.map((a) => ({
        hotelId: a.hotelId,
        name: a.name,
        priceCents: a.nightlyCents,
        note: a.note,
      })),
    }),
    toLog: (output) => [
      {
        avatar: "sub_agent",
        body: `Hotel agent: ranked ${hotels.length} properties, recommends <em>${output.topPick.name}</em>. ${output.preferenceMatch}`,
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
  hotels: HotelOption[],
  nights: number,
  preferredSuppliers: SupplierRow[],
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

  const block = hotels
    .map((h, i) => {
      const totalUsd = h.pricePerNightUsd * nights;
      return [
        `[${i + 1}] hotelId=${h.id}`,
        `    name: ${h.name}`,
        `    neighborhood: ${h.neighborhood}`,
        `    style: ${h.style}`,
        `    stars: ${h.starsApprox}`,
        `    nightly: $${h.pricePerNightUsd.toLocaleString("en-US")} (total ${nights} nights: $${totalUsd.toLocaleString("en-US")})`,
        `    vibe: ${h.vibe}`,
        `    amenities: ${h.amenities.join(", ")}`,
      ].join("\n");
    })
    .join("\n\n");

  /* Odylic's preferred suppliers carry agency-level relationship
   * weight — match catalog hotels to these names when possible and
   * lean toward them in the rationale. */
  const preferredBlock = preferredSuppliers.length
    ? [
        "",
        "**Odylic preferred suppliers in this destination** (favor these when they match a catalog property):",
        preferredSuppliers
          .map((s) => {
            const tags = [
              s.preferred ? "preferred" : null,
              s.virtuoso ? "Virtuoso" : null,
              s.priceTier,
              s.amenities.length ? s.amenities.slice(0, 6).join(", ") : null,
            ]
              .filter(Boolean)
              .join(" · ");
            const note = s.notes ? ` · ${s.notes}` : "";
            return `  • ${s.name} (${[s.city, s.country].filter(Boolean).join(", ")}) — ${tags}${note}`;
          })
          .join("\n"),
      ].join("\n")
    : "";

  return [
    `Traveler: ${trip.client.name}`,
    `Preferences: ${prefsLine}`,
    `Trip: ${trip.name} — ${trip.destination}`,
    `Stay: ${trip.startDate} → ${trip.endDate} (${nights} night${nights === 1 ? "" : "s"}), ${trip.travelerCount} guest${trip.travelerCount === 1 ? "" : "s"}`,
    trip.budgetCents
      ? `Total trip budget: $${(trip.budgetCents / 100).toLocaleString("en-US")}`
      : null,
    preferredBlock,
    "",
    "Hotel options for this destination:",
    block,
    "",
    "Score these against the preferences. Boutique/design/ryokan/riad/lodge styles should outweigh resort or commodity properties when the traveler prefers boutique. If any catalog hotel matches an Odylic preferred supplier, prefer it (mention this in the rationale). Return a structured top pick (hotelId, name, rationale, nightlyCents=cents per night, totalCents=cents for the full stay, nightsTotal), up to 3 alternatives (with their nightlyCents in cents), and a one-sentence preferenceMatch summary. Compute cents from the dollar values (multiply by 100). Use hotelIds verbatim from the list — do not invent any.",
  ]
    .filter(Boolean)
    .join("\n");
}
