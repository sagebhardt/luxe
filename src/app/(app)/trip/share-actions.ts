"use server";

import { revalidatePath } from "next/cache";
import {
  createTripShareToken,
  revokeTripShareToken,
} from "@/lib/share/tokens";

type CreateResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

export async function createShareTokenAction(
  tripId: string,
): Promise<CreateResult> {
  try {
    const row = await createTripShareToken({ tripId });
    revalidatePath("/trip");
    return { ok: true, token: row.token };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "create failed",
    };
  }
}

export async function revokeShareTokenAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await revokeTripShareToken(id);
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "revoke failed",
    };
  }
}
