import { formatDateRange, formatMoney } from "@/lib/format";
import type { trips, agentRuns } from "@/lib/db/schema";

type TripWithAgents = typeof trips.$inferSelect & {
  agentRuns: Pick<typeof agentRuns.$inferSelect, "agent" | "status">[];
};

const AGENT_PILL: Record<
  TripWithAgents["agentRuns"][number]["agent"],
  { icon: string; label: string }
> = {
  flight: { icon: "✈", label: "flight" },
  hotel: { icon: "🏨", label: "hotel" },
  itinerary: { icon: "🗾", label: "itinerary" },
  dining: { icon: "🍱", label: "dining" },
};

const STATUS_BADGE: Record<
  TripWithAgents["status"],
  { className: string; label: string }
> = {
  active: { className: "b-pend", label: "Planning" },
  pending: { className: "b-pend", label: "Planning" },
  draft: { className: "b-pend", label: "Draft" },
  completed: { className: "b-conf", label: "Completed" },
  archived: { className: "b-conf", label: "Archived" },
};

export function TripsTable({ trips }: { trips: TripWithAgents[] }) {
  return (
    <table className="trips-table">
      <thead>
        <tr>
          <th>Destination</th>
          <th>Dates</th>
          <th>Travelers</th>
          <th>Value</th>
          <th>Agents Used</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {trips.map((t) => {
          const distinct = new Map<string, string>();
          for (const r of t.agentRuns) {
            if (r.status === "waiting" || r.status === "failed") continue;
            distinct.set(r.agent, r.agent);
          }
          const agentList = Array.from(distinct.keys()) as Array<
            keyof typeof AGENT_PILL
          >;
          const badge = STATUS_BADGE[t.status];
          return (
            <tr key={t.id}>
              <td className="tbl-dest">{t.name}</td>
              <td>{formatDateRange(t.startDate, t.endDate)}</td>
              <td>{t.travelerCount}</td>
              <td className="tbl-value">{formatMoney(t.budgetCents)}</td>
              <td>
                <div className="tbl-agents">
                  {agentList.map((a) => (
                    <span key={a} className="tbl-agent-pill">
                      {AGENT_PILL[a].icon} {AGENT_PILL[a].label}
                    </span>
                  ))}
                </div>
              </td>
              <td>
                <span className={`badge inline ${badge.className}`}>
                  {badge.label}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
