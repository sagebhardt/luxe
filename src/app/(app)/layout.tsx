import { Nav } from "@/components/shell/Nav";
import { db } from "@/lib/db";
import { agentRuns } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let activeAgentCount = 4;
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentRuns)
      .where(eq(agentRuns.status, "running"));
    if (count > 0) activeAgentCount = count;
  } catch {
    // DB not reachable yet (build-time, missing schema, etc.) — fall back.
  }

  return (
    <>
      <Nav activeAgentCount={activeAgentCount} />
      {children}
    </>
  );
}
