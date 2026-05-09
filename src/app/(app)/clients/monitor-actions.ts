"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { proactiveAlerts } from "@/lib/db/schema";
import { dismissAlert } from "@/lib/queries/proactive-alerts";
import { runProactiveMonitor } from "@/lib/ai/agents/proactive-monitor";
import {
  AuthError,
  assertOwnsClient,
  getCurrentUserOrThrow,
  requireAdmin,
} from "@/lib/auth";

export async function dismissAlertAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const viewer = await getCurrentUserOrThrow();
    /* Alerts belong to a client; only the owning ITD or an admin can
     * dismiss them. */
    const alert = await db.query.proactiveAlerts.findFirst({
      where: eq(proactiveAlerts.id, id),
      columns: { clientId: true },
    });
    if (!alert) return { ok: false, error: "Alert not found" };
    await assertOwnsClient(alert.clientId, viewer);
    await dismissAlert(id);
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : "dismiss failed",
    };
  }
}

export async function runMonitorNowAction(): Promise<
  | { ok: true; alertsCreated: number; clientsScanned: number }
  | { ok: false; error: string }
> {
  try {
    /* Org-wide scan — admin only. Cron does this automatically; this
     * action exists for manual triggering during testing. */
    await requireAdmin();
    const result = await runProactiveMonitor();
    revalidatePath("/clients");
    return {
      ok: true,
      alertsCreated: result.alertsCreated,
      clientsScanned: result.clientsScanned,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : "monitor failed",
    };
  }
}
