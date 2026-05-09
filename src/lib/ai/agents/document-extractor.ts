import "server-only";
import { generateObject } from "ai";
import { z } from "zod";
import { resolveAgent } from "@/lib/ai/registry";

/**
 * Document Vision Extractor
 *
 * Reads a travel document (image or PDF) end-to-end via Gemini's
 * multimodal API and returns:
 *  - kind classification (passport, visa, voucher, etc.)
 *  - 1-line summary
 *  - expiresOn (yyyy-mm-dd) when the doc has a clear expiry
 *  - structured fields the operator/agent might query later
 *
 * One call per document; ~$0.0001 on Gemini Flash.
 */

const KIND_VALUES = [
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
] as const;

export const ExtractionSchema = z.object({
  kind: z.enum(KIND_VALUES),
  summary: z
    .string()
    .describe(
      "1 short sentence describing what this document is. e.g. 'Chilean passport for Marcela Fuentes, valid through 2031.'",
    ),
  expiresOn: z
    .string()
    .nullable()
    .describe(
      "ISO yyyy-mm-dd if the document shows a clear expiry; null otherwise.",
    ),
  fields: z
    .array(
      z.object({
        label: z
          .string()
          .describe("Short label, ≤ 2 words. e.g. 'Passport No.', 'Issue Date', 'Booking Ref'"),
        value: z.string().describe("Verbatim value as printed."),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    )
    .describe(
      "Most useful structured fields, up to ~10. For passports/IDs include name, document number, nationality, expiry. For vouchers include booking reference, provider, dates, total. Skip noise.",
    ),
});

const MAX_FIELDS_DISPLAYED = 10;

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

const SYSTEM_PROMPT = `You analyze travel documents (images and PDFs) and pull out the structured fields a luxury travel agency cares about.

Hard rules:
- Cite values verbatim from the document. No paraphrasing of names, numbers, or dates.
- If a field is unclear or missing, skip it — don't guess.
- Confidence reflects what you can actually read: 'high' = clearly visible, 'medium' = partially obscured/blurry, 'low' = inferred from context.
- Convert dates to ISO yyyy-mm-dd in the expiresOn field. Format the value field naturally as the document shows.
- For non-document images (photos of places/people), kind='photo' and skip extraction.`;

const MAX_BYTES_FOR_INLINE = 18 * 1024 * 1024; // ~Gemini's payload limit

export async function extractDocument(opts: {
  fileName: string;
  mimeType: string | null;
  content: Buffer;
}): Promise<ExtractionResult> {
  if (opts.content.byteLength > MAX_BYTES_FOR_INLINE) {
    return {
      kind: "other",
      summary: `${opts.fileName} (skipped extraction — file too large)`,
      expiresOn: null,
      fields: [],
    };
  }

  const resolved = await resolveAgent("crm_query");
  const isPdf =
    opts.mimeType === "application/pdf" ||
    opts.fileName.toLowerCase().endsWith(".pdf");
  const isImage =
    opts.mimeType?.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(opts.fileName);

  /* If the file isn't an image or a PDF (e.g. .docx), classify on
   * filename only — Gemini can't read those bytes natively. */
  if (!isPdf && !isImage) {
    return {
      kind: "other",
      summary: opts.fileName,
      expiresOn: null,
      fields: [],
    };
  }

  const part: { type: "image"; image: Buffer } | {
    type: "file";
    data: Buffer;
    mediaType: string;
  } = isPdf
    ? {
        type: "file",
        data: opts.content,
        mediaType: opts.mimeType ?? "application/pdf",
      }
    : { type: "image", image: opts.content };

  const { object } = await generateObject({
    model: resolved.model,
    schema: ExtractionSchema,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Filename: ${opts.fileName}\n\nExtract the document.`,
          },
          part,
        ],
      },
    ],
    temperature: 0,
  });

  return { ...object, fields: object.fields.slice(0, MAX_FIELDS_DISPLAYED) };
}
