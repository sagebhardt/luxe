import "server-only";
import { db } from "@/lib/db";
import { auditLog, type auditAction } from "@/lib/db/schema";
import type { Viewer } from "@/lib/auth";

type AuditAction = (typeof auditAction.enumValues)[number];

/**
 * Record an admin action to the audit log. Helper is fire-and-forget
 * conceptually but awaits the insert so the row is durable before
 * the action returns. Failures are swallowed (with console.error)
 * so a logging hiccup never blocks a real admin operation.
 */
export async function recordAudit(
  actor: Viewer,
  action: AuditAction,
  target: { type: string; id: string | null },
  details?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    note?: string;
  },
): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: actor.id,
      action,
      targetType: target.type,
      targetId: target.id,
      before: details?.before ?? null,
      after: details?.after ?? null,
      note: details?.note ?? null,
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
}
