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
}: {
  activeAgentCount: number | null;
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
        <div className="nav-badge">Tokyo · May 2026</div>
        <Link
          href="/admin/models"
          className={`admin-link${pathname?.startsWith("/admin") ? " active" : ""}`}
        >
          Admin
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
