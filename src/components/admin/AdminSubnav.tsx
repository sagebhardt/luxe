"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Users", href: "/admin/users" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Audit", href: "/admin/audit" },
  { label: "Models", href: "/admin/models" },
] as const;

export function AdminSubnav() {
  const pathname = usePathname();
  return (
    <div className="admin-subnav">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`admin-subnav-tab${pathname === t.href ? " active" : ""}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
