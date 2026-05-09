import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, proactiveAlerts } from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth";

export async function listFreshAlerts(viewer: Viewer, limit = 8) {
  /* Scope alerts to the viewer's clients (admins see all). */
  const ownClause =
    viewer.role === "admin" ? undefined : eq(clients.ownerId, viewer.id);

  const rows = await db
    .select({
      id: proactiveAlerts.id,
      clientId: proactiveAlerts.clientId,
      kind: proactiveAlerts.kind,
      severity: proactiveAlerts.severity,
      title: proactiveAlerts.title,
      body: proactiveAlerts.body,
      suggestedAction: proactiveAlerts.suggestedAction,
      dedupeKey: proactiveAlerts.dedupeKey,
      detail: proactiveAlerts.detail,
      triggeredAt: proactiveAlerts.triggeredAt,
      dismissedAt: proactiveAlerts.dismissedAt,
      resolvedAt: proactiveAlerts.resolvedAt,
      client: clients,
    })
    .from(proactiveAlerts)
    .innerJoin(clients, eq(clients.id, proactiveAlerts.clientId))
    .where(
      and(
        isNull(proactiveAlerts.dismissedAt),
        isNull(proactiveAlerts.resolvedAt),
        ownClause,
      ),
    )
    .orderBy(desc(proactiveAlerts.triggeredAt))
    .limit(limit);
  return rows;
}

export async function dismissAlert(id: string) {
  await db
    .update(proactiveAlerts)
    .set({ dismissedAt: new Date() })
    .where(eq(proactiveAlerts.id, id));
}
