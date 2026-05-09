import { Nav } from "@/components/shell/Nav";
import { db } from "@/lib/db";
import { agentRuns } from "@/lib/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/* A run that's been "running" for more than a couple of minutes is a
 * zombie — function timed out, or seed left it pinned. Don't surface
 * those in the nav indicator. */
const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let activeAgentCount: number | null = null;
  try {
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentRuns)
      .where(
        and(eq(agentRuns.status, "running"), gt(agentRuns.startedAt, cutoff)),
      );
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
