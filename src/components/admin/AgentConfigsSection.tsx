import type { agentConfigs, modelProviders } from "@/lib/db/schema";
import { AgentConfigRow } from "./AgentConfigRow";

type Provider = typeof modelProviders.$inferSelect;
type AgentConfig = typeof agentConfigs.$inferSelect & {
  provider: Provider;
};

const AGENT_LABEL: Record<AgentConfig["agentType"], string> = {
  flight: "Flight",
  hotel: "Hotel",
  itinerary: "Itinerary",
  dining: "Dining",
};

export function AgentConfigsSection({
  configs,
  providers,
}: {
  configs: AgentConfig[];
  providers: Provider[];
}) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Agent</th>
          <th>Provider</th>
          <th>Model</th>
          <th>Temp</th>
          <th>Max tokens</th>
          <th>System prompt</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {configs.length === 0 ? (
          <tr>
            <td colSpan={7} className="admin-empty">
              No agent configs yet — run <code>pnpm db:seed-defaults</code>.
            </td>
          </tr>
        ) : (
          configs.map((c) => (
            <AgentConfigRow
              key={c.agentType}
              config={c}
              providers={providers}
              label={AGENT_LABEL[c.agentType]}
            />
          ))
        )}
      </tbody>
    </table>
  );
}
