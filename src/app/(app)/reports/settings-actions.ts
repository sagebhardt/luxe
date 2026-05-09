"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { SUPPORTED_CURRENCIES } from "@/lib/format";

export async function setReportingCurrencyAction(
  currency: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const allowed = SUPPORTED_CURRENCIES as readonly string[];
  if (!allowed.includes(currency)) {
    return { ok: false, error: `Unsupported currency: ${currency}` };
  }
  try {
    await db
      .update(appSettings)
      .set({ reportingCurrency: currency, updatedAt: new Date() })
      .where(eq(appSettings.id, 1));
    revalidatePath("/reports");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "save failed",
    };
  }
}
