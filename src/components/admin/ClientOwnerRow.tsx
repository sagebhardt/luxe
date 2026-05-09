"use client";

import { useState, useTransition } from "react";
import { reassignClientOwnerAction } from "@/app/(app)/admin/clients/actions";
import type { clients as clientsTable } from "@/lib/db/schema";

type Client = typeof clientsTable.$inferSelect;
type UserOption = { id: string; label: string; role: "itd" | "admin" };

const TAG_LABEL: Record<Client["tag"], string> = {
  vip: "VIP",
  active: "Active",
  prospect: "Prospect",
  dormant: "Dormant",
};

export function ClientOwnerRow({
  client,
  users,
  ltvLabel,
}: {
  client: Client;
  users: UserOption[];
  ltvLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onChange = (next: string) => {
    setError(null);
    startTransition(async () => {
      const r = await reassignClientOwnerAction(
        client.id,
        next === "" ? null : next,
      );
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <tr className={pending ? "users-row-pending" : ""}>
      <td className="users-name">{client.name}</td>
      <td>
        <span className={`mock-pill mock-pill-${client.tag}`}>
          {TAG_LABEL[client.tag]}
        </span>
      </td>
      <td className="users-email">{client.stage}</td>
      <td className="num">{ltvLabel}</td>
      <td>
        <select
          value={client.ownerId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={pending}
          className={`users-select${client.ownerId == null ? " warn" : ""}`}
        >
          <option value="">— sin dueño —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
              {u.role === "admin" ? " (admin)" : ""}
            </option>
          ))}
        </select>
        {error ? <div className="users-error-inline">{error}</div> : null}
      </td>
    </tr>
  );
}
