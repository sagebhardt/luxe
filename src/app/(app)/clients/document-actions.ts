"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, type documentKind } from "@/lib/db/schema";
import { extractDocument } from "@/lib/ai/agents/document-extractor";

const ALLOWED_KINDS = [
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

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB after client-side compression

export type UploadDocumentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function uploadDocumentAction(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const tripId = String(formData.get("tripId") ?? "").trim() || null;
  const originalSizeRaw = String(formData.get("originalSize") ?? "");
  const originalSizeBytes = originalSizeRaw
    ? Number(originalSizeRaw)
    : null;
  const file = formData.get("file");
  if (!clientId) return { ok: false, error: "clientId required" };
  if (!(file instanceof File))
    return { ok: false, error: "file is required" };
  if (file.size === 0) return { ok: false, error: "file is empty" };
  if (file.size > MAX_BYTES)
    return {
      ok: false,
      error: `Max upload size is ${MAX_BYTES / 1024 / 1024} MB. Try a smaller file.`,
    };

  const arrayBuffer = await file.arrayBuffer();
  const content = Buffer.from(arrayBuffer);

  /* Extract structured fields via Gemini Vision. Best-effort — on
   * failure we still save the row with kind='other'. */
  let kind: (typeof documentKind.enumValues)[number] = "other";
  let summary: string | null = null;
  let expiresOn: string | null = null;
  let extractedFields: NonNullable<
    typeof documents.$inferInsert.extractedFields
  > | null = null;

  try {
    const r = await extractDocument({
      fileName: file.name,
      mimeType: file.type || null,
      content,
    });
    kind = r.kind;
    summary = r.summary;
    expiresOn = r.expiresOn;
    extractedFields = r.fields;
  } catch (err) {
    console.error("document extraction failed", err);
  }

  try {
    const [row] = await db
      .insert(documents)
      .values({
        clientId,
        tripId,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
        originalSizeBytes:
          Number.isFinite(originalSizeBytes) && originalSizeBytes
            ? originalSizeBytes
            : file.size,
        kind,
        content,
        summary,
        expiresOn,
        extractedFields,
      })
      .returning({ id: documents.id });
    revalidatePath("/clients");
    return { ok: true, id: row.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Insert failed",
    };
  }
}

export async function deleteDocumentAction(
  documentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!documentId) return { ok: false, error: "documentId required" };
  try {
    await db.delete(documents).where(eq(documents.id, documentId));
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function setDocumentKindAction(
  documentId: string,
  kind: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (
    !ALLOWED_KINDS.includes(kind as (typeof ALLOWED_KINDS)[number])
  )
    return { ok: false, error: `unknown kind ${kind}` };
  try {
    await db
      .update(documents)
      .set({ kind: kind as (typeof ALLOWED_KINDS)[number] })
      .where(eq(documents.id, documentId));
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}
