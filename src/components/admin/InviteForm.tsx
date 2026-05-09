"use client";

import { useState, useTransition } from "react";
import { inviteUserAction } from "@/app/(app)/admin/users/invite-actions";

const TIER_PRESETS = [0.5, 0.55, 0.6, 0.65, 0.7] as const;

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"itd" | "admin">("itd");
  const [pct, setPct] = useState(0.5);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const r = await inviteUserAction({
        email,
        role,
        commissionPctBase: pct,
      });
      if (r.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <form className="invite-form" onSubmit={onSubmit}>
      <div className="invite-row">
        <input
          type="email"
          placeholder="email@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending}
          required
          className="invite-input"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "itd" | "admin")}
          disabled={pending}
          className="users-select"
        >
          <option value="itd">ITD</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={pct.toFixed(4)}
          onChange={(e) => setPct(Number(e.target.value))}
          disabled={pending || role === "admin"}
          className="users-select"
        >
          {TIER_PRESETS.map((t) => (
            <option key={t} value={t.toFixed(4)}>
              {Math.round(t * 100)}%
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending || !email}
          className="invite-btn"
        >
          {pending ? "Enviando…" : "Invitar"}
        </button>
      </div>
      {error ? <div className="invite-msg invite-err">{error}</div> : null}
      {success ? (
        <div className="invite-msg invite-ok">
          Invitación enviada. Aparecerá como pendiente abajo y se promoverá
          al rol seleccionado al primer login.
        </div>
      ) : null}
    </form>
  );
}
