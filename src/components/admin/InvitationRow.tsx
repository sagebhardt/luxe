"use client";

import { useState, useTransition } from "react";
import { revokeInvitationAction } from "@/app/(app)/admin/users/invite-actions";

export function InvitationRow({
  invitation,
}: {
  invitation: {
    id: string;
    email: string;
    intendedRole: "itd" | "admin";
    intendedCommissionPctBase: string;
    status: string;
    createdAt: Date;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onRevoke = () => {
    if (!confirm(`Revocar invitación de ${invitation.email}?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await revokeInvitationAction(invitation.id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <tr className={pending ? "users-row-pending" : ""}>
      <td className="users-name">
        <span className="muted">{invitation.email}</span>
        <span className="users-me invite-pending-tag">pendiente</span>
      </td>
      <td className="users-email" colSpan={1}>
        —
      </td>
      <td>{invitation.intendedRole === "admin" ? "Admin" : "ITD"}</td>
      <td className="num">—</td>
      <td className="num">—</td>
      <td className="num">
        {Math.round(Number(invitation.intendedCommissionPctBase) * 100)}%
      </td>
      <td className="users-since">
        invited{" "}
        {new Date(invitation.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
        <button
          type="button"
          className="link-btn link-btn-danger invite-revoke"
          disabled={pending}
          onClick={onRevoke}
        >
          revocar
        </button>
        {error ? <div className="users-error-inline">{error}</div> : null}
      </td>
    </tr>
  );
}
