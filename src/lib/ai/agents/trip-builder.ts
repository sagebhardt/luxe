import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { resolveAgent } from "@/lib/ai/registry";

/**
 * Trip Builder Agent
 *
 * Parses an operator's free-text trip brief into a structured trip
 * proposal. Examples:
 *   "from May 22 to June 2, the client wants LA for 3 days then Arizona"
 *   "Honeymoon in Bali, mid-October, two weeks, ~$25k"
 *
 * Returns: name, dates, multi-segment destination breakdown, traveler
 * count, budget, plus a confidence read so the operator knows what
 * to double-check before creating the trip.
 *
 * Reuses agent_configs(crm_query) for model resolution — same kind of
 * NL-to-structured task. Operator can override per-agent in /admin.
 */

export const TripBuilderSchema = z.object({
  name: z
    .string()
    .describe(
      "2–4 word trip name. Use destination + flavor: 'Los Angeles & Arizona', 'Bali Honeymoon', 'Patagonia Traverse'.",
    ),
  destination: z
    .string()
    .describe(
      "Single human-readable line covering all destinations. Multi-leg: 'Los Angeles + Sedona, Arizona'.",
    ),
  startDate: z
    .string()
    .nullable()
    .describe(
      "ISO yyyy-mm-dd. Use the operator's stated dates. If the year wasn't specified, infer the next occurrence from today.",
    ),
  endDate: z.string().nullable().describe("ISO yyyy-mm-dd"),
  travelerCount: z.number().int().min(1).max(20),
  budgetUsd: z
    .number()
    .nullable()
    .describe("Total budget in USD if mentioned; null otherwise."),
  segments: z
    .array(
      z.object({
        destination: z.string(),
        days: z.number().int().min(1),
        notes: z.string().optional(),
      }),
    )
    .min(1)
    .describe(
      "Each leg of the trip with stated days. Single-destination trips have one segment. Days should sum to the trip length.",
    ),
  summary: z
    .string()
    .describe(
      "1 sentence operator-friendly summary tying client preferences to the trip.",
    ),
  confidence: z.object({
    dates: z.enum(["high", "medium", "low"]),
    destination: z.enum(["high", "medium", "low"]),
    travelers: z.enum(["high", "medium", "low"]),
  }),
  unresolved: z
    .array(z.string())
    .describe(
      "Things the operator should clarify before creating the trip (e.g. 'budget unstated', 'arrival airport unclear'). Empty array if everything is solid.",
    ),
});

export type TripBuilderOutput = z.infer<typeof TripBuilderSchema>;

const SYSTEM_PROMPT = `You are a private travel concierge translating an operator's verbal trip brief into a structured trip plan. The operator types in shorthand; your job is to extract dates, destinations, segments, traveler count, and budget — and flag anything ambiguous.

Hard rules:
- Use the client's stated preferences when they fill in gaps (e.g. if traveler count isn't stated, default to the client's typical based on their trip history; otherwise default to 1).
- For dates without a year, infer the *next future occurrence* from today's date in the prompt context.
- Segment days must sum to (endDate − startDate) calendar days; if they don't, scale or note in unresolved.
- Don't invent specific cities the operator didn't mention. Multi-leg "USA road trip" is fine; inserting "Las Vegas" because it fits geographically is not.
- Confidence is real: high = the operator stated it directly; medium = inferred from context; low = guessed.
- unresolved should call out what *you* couldn't pin down. Empty if everything is concrete.`;

export class TripBuilderError extends Error {}

export async function buildTripFromPrompt(opts: {
  clientId: string;
  prompt: string;
}): Promise<TripBuilderOutput> {
  const text = opts.prompt.trim();
  if (!text) throw new TripBuilderError("Empty prompt");

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, opts.clientId),
    with: { preferences: true },
  });
  if (!client) throw new TripBuilderError(`Client ${opts.clientId} not found`);

  /* Reuse the crm_query agent's model — same NL-to-structured task. */
  const resolved = await resolveAgent("crm_query");

  const today = new Date().toISOString().slice(0, 10);

  const prefs = client.preferences;
  const prefsLine =
    prefs
      ? [
          prefs.flightClass && `flightClass: ${prefs.flightClass}`,
          prefs.hotelStyle && `hotelStyle: ${prefs.hotelStyle}`,
          prefs.pacePreference && `pace: ${prefs.pacePreference}`,
        ]
          .filter(Boolean)
          .join(" · ")
      : "—";

  const userPrompt = [
    `Today: ${today}`,
    `Client: ${client.name}`,
    `Tag: ${client.tag}`,
    `Notes: ${client.notes ?? "—"}`,
    `Preferences: ${prefsLine}`,
    "",
    "Operator brief:",
    text,
    "",
    "Return the structured trip plan.",
  ].join("\n");

  const { object } = await generateObject({
    model: resolved.model,
    schema: TripBuilderSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.2,
  });

  return object;
}
