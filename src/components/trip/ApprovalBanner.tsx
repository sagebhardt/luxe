import type { agentDecisions } from "@/lib/db/schema";

type Decision = typeof agentDecisions.$inferSelect;

export function ApprovalBanner({ decision }: { decision: Decision }) {
  return (
    <div className="approval">
      <div className="appr-icon">⚡</div>
      <div className="appr-body">
        <div className="appr-title">Approval required — {agentLabel(decision.agent)}</div>
        <div className="appr-desc">
          Agent recommends <strong>{decision.headline}</strong>.{" "}
          {decision.rationale}
        </div>
      </div>
      <div className="btn-row">
        <button className="btn btn-forest">Approve & Book</button>
        <button className="btn btn-outline">Alternatives</button>
      </div>
    </div>
  );
}

function agentLabel(agent: Decision["agent"]) {
  switch (agent) {
    case "flight":
      return "flight booking";
    case "hotel":
      return "hotel selection";
    case "itinerary":
      return "itinerary";
    case "dining":
      return "dining reservation";
  }
}
