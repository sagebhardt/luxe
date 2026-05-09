import type { agentDecisions } from "@/lib/db/schema";
import { ApprovalAlternatives } from "./ApprovalAlternatives";
import { formatMoney } from "@/lib/format";

type Decision = typeof agentDecisions.$inferSelect;

type Recommendation = {
  preferenceMatch?: string;
  priceCents?: number;
  nightsTotal?: number;
};

type AlternativeShape = {
  headline?: string;
  name?: string;
  priceCents?: number;
  note?: string;
  offerId?: string;
  accommodationId?: string;
};

export function ApprovalBanner({ decision }: { decision: Decision }) {
  const rec = (decision.recommendation ?? {}) as Recommendation;
  const alts = (decision.alternatives ?? []) as AlternativeShape[];

  return (
    <div className="approval">
      <div className="appr-icon">⚡</div>
      <div className="appr-body">
        <div className="appr-title">
          Approval required — {agentLabel(decision.agent)}
        </div>
        <div className="appr-desc">
          Agent recommends <strong>{decision.headline}</strong>
          {rec.priceCents != null ? (
            <>
              {" "}
              at <strong>{formatMoney(rec.priceCents)}</strong>
              {rec.nightsTotal ? ` (${rec.nightsTotal} nights)` : ""}
            </>
          ) : null}
          {decision.rationale ? <>. {decision.rationale}</> : "."}
        </div>
        {rec.preferenceMatch ? (
          <div className="appr-pref">{rec.preferenceMatch}</div>
        ) : null}
        {alts.length > 0 ? <ApprovalAlternatives alternatives={alts} /> : null}
      </div>
      <div className="btn-row">
        <button className="btn btn-forest">Approve &amp; Book</button>
        <button className="btn btn-outline">Dismiss</button>
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
