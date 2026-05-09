import type { agentRuns } from "@/lib/db/schema";
import { AgentRunButton } from "./AgentRunButton";

type AgentRun = typeof agentRuns.$inferSelect;

const META: Record<
  AgentRun["agent"],
  { icon: string; label: string }
> = {
  flight: { icon: "✈️", label: "Flight Agent" },
  hotel: { icon: "🏨", label: "Hotel Agent" },
  itinerary: { icon: "🗾", label: "Itinerary Agent" },
  dining: { icon: "🍱", label: "Dining Agent" },
};

const STATE_LABEL: Record<AgentRun["status"], string> = {
  done: "✓ done",
  running: "● live",
  waiting: "waiting",
  failed: "failed",
};

const STATE_CLASS: Record<AgentRun["status"], string> = {
  done: "st-done",
  running: "st-live",
  waiting: "st-wait",
  failed: "st-wait",
};

const CARD_CLASS: Record<AgentRun["status"], string> = {
  done: "done",
  running: "running",
  waiting: "wait",
  failed: "wait",
};

export function AgentPipeline({
  runs,
  tripId,
}: {
  runs: AgentRun[];
  tripId: string;
}) {
  // De-duplicate to one card per agent (latest run wins)
  const byAgent = new Map<AgentRun["agent"], AgentRun>();
  for (const r of runs) byAgent.set(r.agent, r);
  const order: AgentRun["agent"][] = ["flight", "hotel", "itinerary", "dining"];
  return (
    <div className="pipeline">
      {order.map((kind) => {
        const r = byAgent.get(kind);
        const status: AgentRun["status"] = r?.status ?? "waiting";
        const headline = r?.headline ?? "";
        const detail = r?.detail ?? "";
        return (
          <div key={kind} className={`ag-card ${CARD_CLASS[status]}`}>
            <span className={`ag-state ${STATE_CLASS[status]}`}>
              {STATE_LABEL[status]}
            </span>
            <div className="ag-icon">{META[kind].icon}</div>
            <div className="ag-name">{META[kind].label}</div>
            <div className="ag-desc">
              {headline ? `${headline}. ` : ""}
              {detail}
            </div>
            <AgentRunButton
              agent={kind}
              tripId={tripId}
              hasRun={!!r && r.status !== "waiting"}
            />
          </div>
        );
      })}
    </div>
  );
}
