"use client";

import Link from "next/link";
import type { ClientFilter } from "@/lib/queries/clients";

const PILLS: { key: ClientFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "vip", label: "VIP" },
  { key: "active", label: "Active" },
  { key: "prospect", label: "Prospect" },
  { key: "dormant", label: "Dormant" },
];

export function ClientFilters({ active }: { active: ClientFilter }) {
  return (
    <div className="crm-filters">
      {PILLS.map((p) => {
        const href = p.key === "all" ? "/clients" : `/clients?filter=${p.key}`;
        return (
          <Link
            key={p.key}
            href={href}
            className={`filter-pill${p.key === active ? " active" : ""}`}
          >
            {p.label}
          </Link>
        );
      })}
    </div>
  );
}
