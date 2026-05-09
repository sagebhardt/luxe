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
  let activeAgentCount: number | null = null;
  try {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentRuns)
      .where(eq(agentRuns.status, "running"));
    activeAgentCount = row?.count ?? 0;
  } catch {
    // DB unreachable — leave null so the Nav hides the indicator.
  }

  return (
    <>
      <Nav activeAgentCount={activeAgentCount} />
      {children}
    </>
  );
}
