import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { outreachDrafts } from "@/lib/db/schema";

export async function listDraftsForClient(clientId: string) {
  return db
    .select()
    .from(outreachDrafts)
    .where(eq(outreachDrafts.clientId, clientId))
    .orderBy(desc(outreachDrafts.createdAt))
    .limit(20);
}
