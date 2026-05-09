import "server-only";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { trips, clients, travelerPreferences } from "@/lib/db/schema";
import { runAgent, type AgentRunResult } from "@/lib/ai/runner";
import {
  suggestSuppliersForAgent,
  type SupplierRow,
} from "@/lib/queries/suppliers";

/**
 * Dining Agent
 *
 * Pure synthesis (no Yelp/OpenTable wired up yet). Returns reservation
 * candidates the operator can manually book. Output explicitly flags
 * that confirmation must happen out-of-band.
 */

export const DiningAgentSchema = z.object({
  candidates: z
    .array(
      z.object({
        name: z.string(),
        cuisine: z.string(),
        neighborhood: z.string(),
        priceTier: z
          .enum(["$", "$$", "$$$", "$$$$"])
          .describe("Rough price tier"),
        why: z
          .string()
          .describe(
            "1–2 sentences tying the choice to the traveler's preferences",
          ),
        bookingDifficulty: z
          .enum(["walk_in", "weeks_ahead", "months_ahead", "concierge_only"])
          .describe("How hard it is to get a reservation"),
      }),
    )
    .min(3)
    .max(6),
  caveats: z
    .string()
    .describe(
      "1–2 sentences on what the operator should verify before promising any reservation",
    ),
});

export type DiningAgentOutput = z.infer<typeof DiningAgentSchema>;

export class DiningAgentInputError extends Error {}

export async function runDiningAgent(
  tripId: string,
): Promise<AgentRunResult<DiningAgentOutput>> {
  const trip = await db.query.trips.findFirst({
    where: eq(trips.id, tripId),
    with: { client: { with: { preferences: true } } },
  });
  if (!trip) throw new DiningAgentInputError(`Trip ${tripId} not found`);

  const preferred = await suggestSuppliersForAgent({
    kind: "restaurant",
    destination: trip.destination,
    limit: 5,
  });

  return runAgent<DiningAgentOutput>({
    agent: "dining",
    tripId,
    headline: `Curating dining options in ${trip.destination}`,
    outputSchema: DiningAgentSchema,
    buildPrompt: () => buildPrompt(trip, preferred),
    toDecision: (output) => ({
      headline: `${output.candidates.length} dining picks for ${trip.destination}`,
      rationale: output.caveats,
      recommendation: {
        candidates: output.candidates,
        caveats: output.caveats,
      },
    }),
    toLog: (output) => [
      {
        avatar: "sub_agent",
        body: `Dining agent: surfaced <em>${output.candidates.length} candidates</em> in ${trip.destination}. ${output.caveats}`,
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
  preferredSuppliers: SupplierRow[],
) {
  const prefs = trip.client.preferences;
  const dietary = prefs?.dietaryRestrictions?.length
    ? prefs.dietaryRestrictions.join(", ")
    : "none";
  const prefsLine =
    [
      prefs?.diningStyle && `style: ${prefs.diningStyle}`,
      `dietary: ${dietary}`,
    ]
      .filter(Boolean)
      .join(" · ") || "no specific preferences on file";

  const preferredBlock = preferredSuppliers.length
    ? [
        "",
        "**Odylic preferred restaurants in this destination** (start your candidate list from these when relevant):",
        preferredSuppliers
          .map((s) => {
            const tags = [
              s.preferred ? "preferred" : null,
              s.priceTier,
              s.amenities.length ? s.amenities.slice(0, 4).join(", ") : null,
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
    `Destination: ${trip.destination}`,
    `Dates: ${trip.startDate} → ${trip.endDate}`,
    preferredBlock,
    "",
    "Recommend 4–6 dining candidates the operator can pursue. Lean heavily on Odylic's preferred restaurants where they fit; supplement with venues known for their cuisine over tourist-popular spots. For each, give cuisine, neighborhood, rough price tier ($–$$$$), 1–2 sentences on why it fits the traveler's preferences, and the booking difficulty (walk_in / weeks_ahead / months_ahead / concierge_only). End with a caveats line reminding the operator that availability and pricing should be confirmed manually before quoting the client — we do not have live restaurant inventory wired up.",
  ]
    .filter(Boolean)
    .join("\n");
}
