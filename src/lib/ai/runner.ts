import "server-only";
import { generateObject } from "ai";
import type { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agentDecisions,
  agentLogMessages,
  agentRuns,
  type agentType,
} from "@/lib/db/schema";
import { resolveAgent, ProviderConfigError } from "./registry";

type AgentKind = (typeof agentType.enumValues)[number];

/**
 * Generic agent runner — provider-agnostic. Each domain agent (Flight,
 * Hotel, Itinerary, Dining) wraps `runAgent` with its own input shape,
 * output schema, and prompt-building logic.
 *
 * Lifecycle:
 *   1. Insert an `agent_runs` row (status=running, headline)
 *   2. Build prompt + call provider via Vercel AI SDK with structured output
 *   3. On success: persist `agent_decisions`, agent_log_messages, mark run `done`
 *   4. On failure: mark run `failed` with error detail
 */

export type AgentRunInput<TOutput> = {
  agent: AgentKind;
  tripId: string;
  /** Free-text headline for the agent_runs row + log entry. */
  headline: string;
  /** What the model should produce. */
  outputSchema: z.ZodType<TOutput>;
  /** User-level prompt; system prompt is read from agent_configs. */
  buildPrompt: (ctx: { systemPrompt: string | null }) => string;
  /** Persist a structured decision after the model returns. */
  toDecision: (output: TOutput) => DecisionPayload;
  /** Optional log lines emitted alongside the run. */
  toLog?: (output: TOutput) => LogEntry[];
};

export type DecisionPayload = {
  headline: string;
  rationale: string | null;
  recommendation: Record<string, unknown>;
  alternatives?: Record<string, unknown>[];
};

export type LogEntry = {
  avatar: "orchestrator" | "sub_agent";
  body: string;
};

export type AgentRunResult<TOutput> = {
  runId: string;
  decisionId: string | null;
  output: TOutput;
};

export async function runAgent<TOutput>(
  input: AgentRunInput<TOutput>,
): Promise<AgentRunResult<TOutput>> {
  const startedAt = new Date();
  const [run] = await db
    .insert(agentRuns)
    .values({
      tripId: input.tripId,
      agent: input.agent,
      status: "running",
      headline: input.headline,
      startedAt,
    })
    .returning();

  try {
    const resolved = await resolveAgent(input.agent);
    const prompt = input.buildPrompt({ systemPrompt: resolved.systemPrompt });

    const { object } = await generateObject({
      model: resolved.model,
      schema: input.outputSchema,
      system: resolved.systemPrompt ?? undefined,
      prompt,
      temperature: resolved.settings?.temperature,
      topP: resolved.settings?.topP,
    });

    const decision = input.toDecision(object);
    const [decisionRow] = await db
      .insert(agentDecisions)
      .values({
        tripId: input.tripId,
        agentRunId: run.id,
        agent: input.agent,
        headline: decision.headline,
        rationale: decision.rationale,
        recommendation: decision.recommendation,
        alternatives: decision.alternatives ?? null,
        status: "pending_approval",
      })
      .returning({ id: agentDecisions.id });

    const logs = input.toLog?.(object) ?? [];
    if (logs.length) {
      await db.insert(agentLogMessages).values(
        logs.map((l) => ({
          tripId: input.tripId,
          avatar: l.avatar,
          body: l.body,
        })),
      );
    }

    await db
      .update(agentRuns)
      .set({ status: "done", completedAt: new Date() })
      .where(eq(agentRuns.id, run.id));

    return { runId: run.id, decisionId: decisionRow.id, output: object };
  } catch (err) {
    const message = describeError(err);
    await db
      .update(agentRuns)
      .set({
        status: "failed",
        detail: message,
        completedAt: new Date(),
      })
      .where(eq(agentRuns.id, run.id));
    throw err;
  }
}

function describeError(err: unknown): string {
  if (err instanceof ProviderConfigError) return `provider: ${err.message}`;
  if (err instanceof Error) return err.message;
  return "unknown agent failure";
}
