"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, type documentKind } from "@/lib/db/schema";
import { classifyDocument } from "@/lib/ai/agents/document-classifier";

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

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export type UploadDocumentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function uploadDocumentAction(
  formData: FormData,
): Promise<UploadDocumentResult> {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const tripId = String(formData.get("tripId") ?? "").trim() || null;
  const file = formData.get("file");
  if (!clientId) return { ok: false, error: "clientId required" };
  if (!(file instanceof File))
    return { ok: false, error: "file is required" };
  if (file.size === 0) return { ok: false, error: "file is empty" };
  if (file.size > MAX_BYTES)
    return { ok: false, error: `Max file size is ${MAX_BYTES / 1024 / 1024} MB` };

  /* Read into a Buffer for bytea insertion. */
  const arrayBuffer = await file.arrayBuffer();
  const content = Buffer.from(arrayBuffer);

  /* Classify (best-effort; failures fall back to 'other'). */
  let kind: (typeof documentKind.enumValues)[number] = "other";
  let summary: string | null = null;
  try {
    const r = await classifyDocument({
      fileName: file.name,
      mimeType: file.type || null,
    });
    kind = r.kind;
    summary = r.summary;
  } catch {
    /* swallow — non-blocking */
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
        kind,
        content,
        summary,
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
