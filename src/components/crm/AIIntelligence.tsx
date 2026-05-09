import type { aiInsights } from "@/lib/db/schema";
import { DraftOutreachLink } from "./DraftOutreachLink";

type Insight = typeof aiInsights.$inferSelect;

const LABEL: Record<Insight["kind"], string> = {
  next_trip_signal: "Next Trip Signal",
  spend_pattern: "Spend Pattern",
  risk_flag: "Risk Flag",
};

export function AIIntelligence({
  insights,
  clientId,
}: {
  insights: Insight[];
  clientId: string;
}) {
  if (insights.length === 0) {
    return (
      <div className="intel-card">
        Insights will appear once enough trip history is on file.
      </div>
    );
  }
  return (
    <>
      {insights.map((i) => (
        <div key={i.id} className="intel-card">
          <div className="intel-head">
            <div className="intel-label">{LABEL[i.kind]}</div>
            <DraftOutreachLink clientId={clientId} insightId={i.id} />
          </div>
          <span dangerouslySetInnerHTML={{ __html: i.body }} />
        </div>
      ))}
    </>
  );
}
