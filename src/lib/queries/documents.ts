import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

/**
 * List documents for a client. Excludes the bytea `content` column —
 * we only fetch contents when serving the download route. */
export async function listDocumentsForClient(clientId: string) {
  return db
    .select({
      id: documents.id,
      clientId: documents.clientId,
      tripId: documents.tripId,
      fileName: documents.fileName,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      originalSizeBytes: documents.originalSizeBytes,
      kind: documents.kind,
      summary: documents.summary,
      expiresOn: documents.expiresOn,
      extractedFields: documents.extractedFields,
      uploadedAt: documents.uploadedAt,
    })
    .from(documents)
    .where(eq(documents.clientId, clientId))
    .orderBy(desc(documents.uploadedAt));
}

export type DocumentRow = Awaited<
  ReturnType<typeof listDocumentsForClient>
>[number];
