"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function setUserRoleAction(
  userId: string,
  role: "itd" | "admin",
): Promise<Result> {
  if (!userId) return { ok: false, error: "userId required" };
  if (role !== "itd" && role !== "admin") {
    return { ok: false, error: `Unknown role: ${role}` };
  }
  try {
    const me = await requireAdmin();
    /* Prevent an admin from accidentally demoting themselves to ITD if
     * they're the only admin — they'd lock themselves out of /admin. */
    if (userId === me.id && role !== "admin") {
      return {
        ok: false,
        error: "Refusing to demote the current admin from this UI.",
      };
    }
    const before = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { role: true, name: true, email: true },
    });
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
    if (before && before.role !== role) {
      await recordAudit(me, "user_role_change", { type: "user", id: userId }, {
        before: { role: before.role },
        after: { role },
        note: `${before.name ?? before.email ?? userId}: ${before.role} → ${role}`,
      });
    }
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "set role failed") };
  }
}

export async function setUserCommissionAction(
  userId: string,
  pct: number,
): Promise<Result> {
  if (!userId) return { ok: false, error: "userId required" };
  if (!Number.isFinite(pct) || pct < 0 || pct > 1) {
    return { ok: false, error: "Commission must be between 0 and 1" };
  }
  try {
    const me = await requireAdmin();
    const before = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { commissionPctBase: true, name: true, email: true },
    });
    await db
      .update(users)
      .set({
        commissionPctBase: pct.toFixed(4),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    if (before && Number(before.commissionPctBase) !== pct) {
      await recordAudit(
        me,
        "user_commission_change",
        { type: "user", id: userId },
        {
          before: { commissionPctBase: before.commissionPctBase },
          after: { commissionPctBase: pct.toFixed(4) },
          note: `${before.name ?? before.email ?? userId}: ${(Number(before.commissionPctBase) * 100).toFixed(0)}% → ${(pct * 100).toFixed(0)}%`,
        },
      );
    }
    revalidatePath("/admin/users");
    revalidatePath("/reports");
    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "set commission failed") };
  }
}
