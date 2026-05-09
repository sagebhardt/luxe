"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
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

export type UploadDocumentResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function uploadDocumentAction(
  formData: FormData,
): Promise<UploadDocumentResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "Vercel Blob is not configured. Add the Blob integration in your project settings.",
    };
  }

  const clientId = String(formData.get("clientId") ?? "").trim();
  const tripId = String(formData.get("tripId") ?? "").trim() || null;
  const file = formData.get("file");
  if (!clientId) return { ok: false, error: "clientId required" };
  if (!(file instanceof File))
    return { ok: false, error: "file is required" };
  if (file.size === 0) return { ok: false, error: "file is empty" };
  if (file.size > 25 * 1024 * 1024)
    return { ok: false, error: "max file size is 25 MB" };

  /* Upload to Vercel Blob. Pathname includes a random suffix so two
   * files with the same name don't collide. */
  let blob: Awaited<ReturnType<typeof put>>;
  try {
    blob = await put(`clients/${clientId}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || undefined,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Blob upload failed",
    };
  }

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
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        summary,
      })
      .returning({ id: documents.id });
    revalidatePath("/clients");
    return { ok: true, id: row.id };
  } catch (err) {
    /* Roll back the blob if DB insert fails so we don't orphan files. */
    void del(blob.url).catch(() => {});
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
    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });
    if (!doc) return { ok: false, error: "not found" };
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(doc.blobUrl).catch(() => {});
    }
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
