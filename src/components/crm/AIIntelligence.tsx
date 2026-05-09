import type { aiInsights } from "@/lib/db/schema";

type Insight = typeof aiInsights.$inferSelect;

const LABEL: Record<Insight["kind"], string> = {
  next_trip_signal: "Next Trip Signal",
  spend_pattern: "Spend Pattern",
  risk_flag: "Risk Flag",
};

export function AIIntelligence({ insights }: { insights: Insight[] }) {
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
          <div className="intel-label">{LABEL[i.kind]}</div>
          <span dangerouslySetInnerHTML={{ __html: i.body }} />
        </div>
      ))}
    </>
  );
}
