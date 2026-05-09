import { NextResponse } from "next/server";
import { runProactiveMonitor } from "@/lib/ai/agents/proactive-monitor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/cron/monitor
 *
 * Vercel Cron triggers this daily. Authenticated via the CRON_SECRET
 * env var that Vercel injects automatically (when configured).
 * Manual invocations from the operator must include the same bearer.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (process.env.CRON_SECRET && auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runProactiveMonitor();
  return NextResponse.json({ ok: true, ...result });
}
