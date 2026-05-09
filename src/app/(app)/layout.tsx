import { Nav } from "@/components/shell/Nav";
import { db } from "@/lib/db";
import { agentRuns, clients, trips } from "@/lib/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

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
  const viewer = await getCurrentUser();
  let activeAgentCount: number | null = null;
  try {
    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const baseConditions = [
      eq(agentRuns.status, "running"),
      gt(agentRuns.startedAt, cutoff),
    ];
    /* For ITDs, only count agents on trips they own — admins see all. */
    if (viewer && viewer.role !== "admin") {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentRuns)
        .innerJoin(trips, eq(trips.id, agentRuns.tripId))
        .innerJoin(clients, eq(clients.id, trips.clientId))
        .where(and(...baseConditions, eq(clients.ownerId, viewer.id)));
      activeAgentCount = row?.count ?? 0;
    } else {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(agentRuns)
        .where(and(...baseConditions));
      activeAgentCount = row?.count ?? 0;
    }
  } catch {
    // DB unreachable — leave null so the Nav hides the indicator.
  }

  return (
    <>
      <Nav
        activeAgentCount={activeAgentCount}
        isAdmin={viewer?.role === "admin"}
      />
      {children}
    </>
  );
}
