import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { proactiveAlerts } from "@/lib/db/schema";

export async function listFreshAlerts(limit = 8) {
  return db.query.proactiveAlerts.findMany({
    where: and(
      isNull(proactiveAlerts.dismissedAt),
      isNull(proactiveAlerts.resolvedAt),
    ),
    with: { client: true },
    orderBy: [desc(proactiveAlerts.triggeredAt)],
    limit,
  });
}

export async function dismissAlert(id: string) {
  await db
    .update(proactiveAlerts)
    .set({ dismissedAt: new Date() })
    .where(eq(proactiveAlerts.id, id));
}
