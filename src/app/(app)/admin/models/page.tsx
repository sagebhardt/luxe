import { listAgentConfigs, listProviders } from "@/lib/queries/admin";
import { ProvidersSection } from "@/components/admin/ProvidersSection";
import { AgentConfigsSection } from "@/components/admin/AgentConfigsSection";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const [providers, agentConfigs] = await Promise.all([
    listProviders(),
    listAgentConfigs(),
  ]);

  return (
    <main className="admin-main">
      <div className="admin-header">
        <h1 className="admin-heading">Models &amp; Providers</h1>
        <p className="admin-sub">
          Configure which model runs each agent. Providers reference Vercel
          environment variables for their credentials — the secret values
          themselves live in Vercel, not here.
        </p>
      </div>

      <section className="admin-section">
        <div className="admin-section-head">
          <div className="sec-lbl">Providers</div>
        </div>
        <ProvidersSection providers={providers} />
      </section>

      <section className="admin-section">
        <div className="admin-section-head">
          <div className="sec-lbl">Agent Configs</div>
        </div>
        <AgentConfigsSection
          configs={agentConfigs}
          providers={providers}
        />
      </section>
    </main>
  );
}
