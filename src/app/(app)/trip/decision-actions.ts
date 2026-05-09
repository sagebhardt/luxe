"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentDecisions,
  agentLogMessages,
  bookings,
  trips,
} from "@/lib/db/schema";

type DecisionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function approveDecisionAction(
  decisionId: string,
): Promise<DecisionResult> {
  try {
    const decision = await db.query.agentDecisions.findFirst({
      where: eq(agentDecisions.id, decisionId),
    });
    if (!decision) return { ok: false, error: "Decision not found" };
    if (decision.status !== "pending_approval") {
      return {
        ok: false,
        error: `Decision is already ${decision.status}.`,
      };
    }

    const rec = (decision.recommendation ?? {}) as Record<string, unknown>;

    /* For flight/hotel, materialize a booking. Itinerary/dining stay
     * as approved decisions — the operator handles those bookings
     * out-of-band (we don't have live restaurant inventory etc.). */
    if (decision.agent === "flight" || decision.agent === "hotel") {
      const priceCents = numOrNull(rec.priceCents);
      const detailLine =
        typeof rec.preferenceMatch === "string" ? rec.preferenceMatch : null;
      /* Seed sellAmount from the recommended price. priceCents is a
       * legacy USD-cents field; we'll keep it for back-compat but the
       * authoritative sell value lives in the new numeric column. */
      const sellAmount =
        priceCents != null ? (priceCents / 100).toFixed(2) : null;
      await db.insert(bookings).values({
        tripId: decision.tripId,
        decisionId: decision.id,
        kind: decision.agent === "flight" ? "flight" : "hotel",
        title: decision.headline,
        detail: detailLine,
        priceCents,
        sellAmount,
        status: "confirmed",
        metadata: {
          featured: true,
          subtitle:
            decision.agent === "flight" ? "Flight" : "Hotel",
          source: "agent_decision",
          recommendation: rec,
        },
        confirmedAt: new Date(),
      });
    }

    await db
      .update(agentDecisions)
      .set({ status: "approved", reviewedAt: new Date() })
      .where(eq(agentDecisions.id, decisionId));

    await db.insert(agentLogMessages).values({
      tripId: decision.tripId,
      avatar: "orchestrator",
      body: `Operator approved <em>${decision.headline}</em>${
        decision.agent === "flight" || decision.agent === "hotel"
          ? " — booking added to committed decisions."
          : "."
      }`,
    });

    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "approval failed",
    };
  }
}

export async function dismissDecisionAction(
  decisionId: string,
): Promise<DecisionResult> {
  try {
    const decision = await db.query.agentDecisions.findFirst({
      where: eq(agentDecisions.id, decisionId),
    });
    if (!decision) return { ok: false, error: "Decision not found" };

    await db
      .update(agentDecisions)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(eq(agentDecisions.id, decisionId));

    await db.insert(agentLogMessages).values({
      tripId: decision.tripId,
      avatar: "orchestrator",
      body: `Operator dismissed <em>${decision.headline}</em>.`,
    });

    revalidatePath("/trip");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "dismiss failed",
    };
  }
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
