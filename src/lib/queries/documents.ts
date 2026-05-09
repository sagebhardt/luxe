import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function listDocumentsForClient(clientId: string) {
  return db
    .select()
    .from(documents)
    .where(eq(documents.clientId, clientId))
    .orderBy(desc(documents.uploadedAt));
}

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}
