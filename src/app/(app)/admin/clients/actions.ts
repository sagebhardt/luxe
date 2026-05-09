"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function reassignClientOwnerAction(
  clientId: string,
  newOwnerId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!clientId) return { ok: false, error: "clientId required" };
  try {
    const me = await requireAdmin();
    /* Validate the proposed owner exists, unless we're explicitly
     * unassigning. */
    if (newOwnerId) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, newOwnerId),
        columns: { id: true },
      });
      if (!owner) return { ok: false, error: "Selected user not found" };
    }
    const before = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
      columns: { ownerId: true, name: true },
    });
    await db
      .update(clients)
      .set({ ownerId: newOwnerId, updatedAt: new Date() })
      .where(eq(clients.id, clientId));
    if (before && before.ownerId !== newOwnerId) {
      await recordAudit(
        me,
        "client_owner_reassign",
        { type: "client", id: clientId },
        {
          before: { ownerId: before.ownerId },
          after: { ownerId: newOwnerId },
          note: `${before.name}: owner ${before.ownerId ?? "(none)"} → ${newOwnerId ?? "(none)"}`,
        },
      );
    }
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
