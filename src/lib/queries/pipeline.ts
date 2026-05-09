import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, trips } from "@/lib/db/schema";
import type { PipelineCard, Stage } from "@/lib/pipeline";

export async function listPipelineCards(): Promise<PipelineCard[]> {
  const clientRows = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.lifetimeValueCents));

  const tripRows = await db
    .select()
    .from(trips)
    .orderBy(asc(trips.status), desc(trips.startDate));

  const tripsByClient = new Map<string, (typeof tripRows)[number][]>();
  for (const t of tripRows) {
    const arr = tripsByClient.get(t.clientId) ?? [];
    arr.push(t);
    tripsByClient.set(t.clientId, arr);
  }

  return clientRows.map((c) => {
    const ts = tripsByClient.get(c.id) ?? [];
    const active = ts.find(
      (t) => t.status === "active" || t.status === "pending",
    );
    const fallback = ts[0] ?? null;
    const pick = active ?? fallback;
    return {
      id: c.id,
      name: c.name,
      initial: c.name.charAt(0),
      avatarColor: c.avatarColor,
      tag: c.tag,
      stage: c.stage,
      lifetimeValueCents: c.lifetimeValueCents,
      currentDealCents: pick?.budgetCents ?? null,
      currentDealName: pick?.name ?? null,
      currentDealStatus: pick?.status ?? null,
    };
  });
}

export async function updateClientStage(
  clientId: string,
  stage: Stage,
): Promise<void> {
  await db
    .update(clients)
    .set({ stage, updatedAt: new Date() })
    .where(eq(clients.id, clientId));
}
