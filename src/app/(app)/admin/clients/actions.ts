"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";

export async function reassignClientOwnerAction(
  clientId: string,
  newOwnerId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!clientId) return { ok: false, error: "clientId required" };
  try {
    await requireAdmin();
    /* Validate the proposed owner exists, unless we're explicitly
     * unassigning. */
    if (newOwnerId) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, newOwnerId),
        columns: { id: true },
      });
      if (!owner) return { ok: false, error: "Selected user not found" };
    }
    await db
      .update(clients)
      .set({ ownerId: newOwnerId, updatedAt: new Date() })
      .where(eq(clients.id, clientId));
    revalidatePath("/admin/clients");
    revalidatePath("/clients");
    revalidatePath("/pipeline");
    revalidatePath("/reports");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof AuthError
          ? err.message
          : err instanceof Error
            ? err.message
            : "reassign failed",
    };
  }
}
