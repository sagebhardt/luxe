import "server-only";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, trips } from "@/lib/db/schema";
import type { PipelineCard, Stage } from "@/lib/pipeline";
import type { Viewer } from "@/lib/auth";

export async function listPipelineCards(
  viewer: Viewer,
): Promise<PipelineCard[]> {
  const own = viewer.role === "admin" ? undefined : eq(clients.ownerId, viewer.id);
  const clientRows = await db
    .select()
    .from(clients)
    .where(own)
    .orderBy(desc(clients.lifetimeValueCents));

  if (clientRows.length === 0) return [];

  /* Scope trips to the visible client set so we don't pull cross-tenant
   * deal data for the right-rail status. */
  const visibleIds = clientRows.map((c) => c.id);
  const tripRows = await db
    .select()
    .from(trips)
    .where(inArray(trips.clientId, visibleIds))
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
