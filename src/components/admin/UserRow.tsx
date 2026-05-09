"use client";

import { useState, useTransition } from "react";
import {
  setUserCommissionAction,
  setUserRoleAction,
} from "@/app/(app)/admin/users/actions";
import { formatAmountShort } from "@/lib/format";
import type { UserWithStats } from "@/lib/queries/users";

const TIER_PRESETS = [0.5, 0.55, 0.6, 0.65, 0.7] as const;

export function UserRow({
  user,
  isMe,
}: {
  user: UserWithStats;
  isMe: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const currentPct = Number(user.commissionPctBase);

  const onRoleChange = (next: "itd" | "admin") => {
    setError(null);
    startTransition(async () => {
      const r = await setUserRoleAction(user.id, next);
      if (!r.ok) setError(r.error);
    });
  };

  const onPctChange = (next: number) => {
    setError(null);
    startTransition(async () => {
      const r = await setUserCommissionAction(user.id, next);
      if (!r.ok) setError(r.error);
    });
  };

  const since = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <tr className={pending ? "users-row-pending" : ""}>
      <td className="users-name">
        {user.name || <span className="muted">—</span>}
        {isMe ? <span className="users-me">tú</span> : null}
      </td>
      <td className="users-email">{user.email || "—"}</td>
      <td>
        <select
          value={user.role}
          onChange={(e) => onRoleChange(e.target.value as "itd" | "admin")}
          disabled={pending || isMe}
          className="users-select"
          title={isMe ? "No puedes cambiar tu propio rol" : ""}
        >
          <option value="itd">ITD</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="num">{user.clientCount}</td>
      <td className="num">
        {user.sellTotal > 0 ? formatAmountShort(user.sellTotal, "USD") : "—"}
      </td>
      <td className="num">
        {user.role === "admin" ? (
          <span className="muted">n/a</span>
        ) : (
          <select
            value={currentPct.toFixed(4)}
            onChange={(e) => onPctChange(Number(e.target.value))}
            disabled={pending}
            className="users-select"
          >
            {TIER_PRESETS.map((t) => (
              <option key={t} value={t.toFixed(4)}>
                {Math.round(t * 100)}%
              </option>
            ))}
            {/* Allow custom values that aren't in the preset list */}
            {!TIER_PRESETS.includes(currentPct as (typeof TIER_PRESETS)[number]) ? (
              <option value={currentPct.toFixed(4)}>
                {(currentPct * 100).toFixed(1)}%
              </option>
            ) : null}
          </select>
        )}
      </td>
      <td className="users-since">{since}</td>
      {error ? (
        <td colSpan={7} className="users-error">
          {error}
        </td>
      ) : null}
    </tr>
  );
}
