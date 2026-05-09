import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Gate the entire /admin tree on role='admin'. Non-admins (including
 * unauthenticated requests, though those hit Clerk first) get bounced
 * to the dashboard. This closes a live auth hole — until tenancy
 * landed, /admin/models was visible to any authed user.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getCurrentUser();
  if (!viewer || viewer.role !== "admin") {
    redirect("/clients");
  }
  return <>{children}</>;
}
