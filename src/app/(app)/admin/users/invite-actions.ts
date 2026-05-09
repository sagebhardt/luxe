"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { userInvitations } from "@/lib/db/schema";
import { AuthError, requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };

function authError(err: unknown, fallback: string) {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function inviteUserAction(opts: {
  email: string;
  role: "itd" | "admin";
  commissionPctBase: number;
}): Promise<Result> {
  const email = opts.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email is required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid email" };
  }
  if (opts.role !== "itd" && opts.role !== "admin") {
    return { ok: false, error: `Unknown role: ${opts.role}` };
  }
  if (
    !Number.isFinite(opts.commissionPctBase) ||
    opts.commissionPctBase < 0 ||
    opts.commissionPctBase > 1
  ) {
    return { ok: false, error: "Commission must be between 0 and 1" };
  }

  try {
    const me = await requireAdmin();
    const client = await clerkClient();
    /* Send the invitation email through Clerk. The redirect_url
     * lands them at /sign-up; getCurrentUser() lazy-provisions
     * their users row on first authed request. */
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: "/clients",
      ignoreExisting: false,
    });

    /* Mirror the invitation locally so /admin/users can show pending
     * invites and we can promote-on-acceptance to the intended tier. */
    await db.insert(userInvitations).values({
      clerkInvitationId: invitation.id,
      email,
      intendedRole: opts.role,
      intendedCommissionPctBase: opts.commissionPctBase.toFixed(4),
      invitedByUserId: me.id,
      status: "pending",
    });

    await recordAudit(
      me,
      "user_invited",
      { type: "invitation", id: invitation.id },
      {
        after: {
          email,
          role: opts.role,
          commission: opts.commissionPctBase.toFixed(4),
        },
        note: `Invited ${email} as ${opts.role} (${(opts.commissionPctBase * 100).toFixed(0)}%)`,
      },
    );

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "invite failed") };
  }
}

export async function revokeInvitationAction(
  invitationId: string,
): Promise<Result> {
  if (!invitationId) return { ok: false, error: "invitationId required" };
  try {
    const me = await requireAdmin();
    const local = await db.query.userInvitations.findFirst({
      where: eq(userInvitations.id, invitationId),
    });
    if (!local) return { ok: false, error: "Invitation not found" };

    const client = await clerkClient();
    /* Revoke at Clerk (best-effort — if it's already accepted/expired
     * upstream, we still flip our local status). */
    try {
      await client.invitations.revokeInvitation(local.clerkInvitationId);
    } catch (err) {
      console.error("clerk revoke failed", err);
    }

    await db
      .update(userInvitations)
      .set({ status: "revoked" })
      .where(eq(userInvitations.id, invitationId));

    await recordAudit(
      me,
      "user_invitation_revoked",
      { type: "invitation", id: invitationId },
      { note: `Revoked invitation for ${local.email}` },
    );

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: authError(err, "revoke failed") };
  }
}
