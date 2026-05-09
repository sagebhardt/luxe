import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { resolveAgent } from "@/lib/ai/registry";

/**
 * Lightweight classifier — given a filename and mime type, predicts
 * what kind of travel document this is. Uses the operator's configured
 * Gemini Flash model. Doesn't read the file contents.
 */

const ClassifierSchema = z.object({
  kind: z.enum([
    "passport",
    "visa",
    "id",
    "voucher",
    "ticket",
    "insurance",
    "contract",
    "receipt",
    "photo",
    "other",
  ]),
  confidence: z.enum(["high", "medium", "low"]),
  summary: z
    .string()
    .describe(
      "1 short sentence describing what this document likely contains, derived from the filename only.",
    ),
});

export type ClassifierResult = z.infer<typeof ClassifierSchema>;

export async function classifyDocument(opts: {
  fileName: string;
  mimeType: string | null;
}): Promise<ClassifierResult> {
  /* Reuse a fast model. crm_query is the lightest task config. */
  const resolved = await resolveAgent("crm_query");

  const { object } = await generateObject({
    model: resolved.model,
    schema: ClassifierSchema,
    system:
      "You classify travel documents purely from filename. Be conservative: if the name doesn't strongly suggest a kind, return 'other' with low confidence.",
    prompt: `Filename: ${opts.fileName}\nMIME type: ${opts.mimeType ?? "unknown"}`,
    temperature: 0,
  });

  return object;
}
