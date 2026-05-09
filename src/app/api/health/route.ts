import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const startedAt = Date.now();
  try {
    const result = await db.execute(sql`select 1 as ok`);
    return NextResponse.json({
      status: "ok",
      db: { connected: true, sample: result.rows ?? result },
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown database error";
    return NextResponse.json(
      {
        status: "error",
        db: { connected: false, error: message },
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
