import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { agentConfigs, modelProviders } from "@/lib/db/schema";

export async function listProviders() {
  return db.select().from(modelProviders).orderBy(asc(modelProviders.slug));
}

export async function listAgentConfigs() {
  return db.query.agentConfigs.findMany({
    with: { provider: true },
    orderBy: (t, { asc }) => [asc(t.agentType)],
  });
}
