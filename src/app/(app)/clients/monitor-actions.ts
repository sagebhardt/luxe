"use server";

import { revalidatePath } from "next/cache";
import { dismissAlert } from "@/lib/queries/proactive-alerts";
import { runProactiveMonitor } from "@/lib/ai/agents/proactive-monitor";

export async function dismissAlertAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await dismissAlert(id);
    revalidatePath("/clients");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "dismiss failed",
    };
  }
}

export async function runMonitorNowAction(): Promise<
  | { ok: true; alertsCreated: number; clientsScanned: number }
  | { ok: false; error: string }
> {
  try {
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
      error: err instanceof Error ? err.message : "monitor failed",
    };
  }
}
