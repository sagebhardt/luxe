"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

const TABS = [
  { label: "Trip Planning", href: "/trip" },
  { label: "Client CRM", href: "/clients" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Reports", href: "/reports" },
];

export function Nav({
  activeAgentCount,
  isAdmin,
}: {
  activeAgentCount: number | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <nav className="nav">
      <div className="wordmark">
        Luxe<sup>AI</sup>
      </div>
      <div className="nav-tabs">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`nav-tab${isActive(t.href) ? " active" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        {activeAgentCount && activeAgentCount > 0 ? (
          <div className="live-dot">
            <div className="pulse" />
            {activeAgentCount} agent{activeAgentCount === 1 ? "" : "s"} running
          </div>
        ) : null}
        {isAdmin ? (
          <Link
            href="/admin/users"
            className={`admin-link${pathname?.startsWith("/admin") ? " active" : ""}`}
          >
            Admin
          </Link>
        ) : null}
        <Link
          href="/settings"
          className={`admin-link${pathname?.startsWith("/settings") ? " active" : ""}`}
        >
          Settings
        </Link>
        <UserButton
          appearance={{
            elements: { avatarBox: { width: 28, height: 28 } },
          }}
        />
      </div>
    </nav>
  );
}
