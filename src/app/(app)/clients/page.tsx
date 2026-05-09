import { notFound } from "next/navigation";
import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { ProfileHeader } from "@/components/crm/ProfileHeader";
import { KpiStrip } from "@/components/crm/KpiStrip";
import { ProfileTabs } from "@/components/crm/ProfileTabs";
import { AIIntelligence } from "@/components/crm/AIIntelligence";
import { RegenerateInsightsButton } from "@/components/crm/RegenerateInsightsButton";
import { OutreachDrafts } from "@/components/crm/OutreachDrafts";
import { listDraftsForClient } from "@/lib/queries/outreach";
import { listFreshAlerts } from "@/lib/queries/proactive-alerts";
import { AlertBanner } from "@/components/crm/AlertBanner";
import { ActivityFeed } from "@/components/crm/ActivityFeed";
import { QuickNote } from "@/components/crm/QuickNote";
import {
  type ClientFilter,
  getClientDetail,
  getDefaultClientId,
  listClients,
} from "@/lib/queries/clients";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  id?: string;
  filter?: string;
  q?: string;
}>;

const FILTERS: ClientFilter[] = [
  "all",
  "vip",
  "active",
  "prospect",
  "dormant",
];

function asFilter(value: string | undefined): ClientFilter {
  return FILTERS.find((f) => f === value) ?? ("all" as ClientFilter);
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filter = asFilter(sp.filter);
  const search = sp.q ?? "";
  const clientId = sp.id ?? (await getDefaultClientId());
  if (!clientId) notFound();

  const [list, detail, drafts, alerts] = await Promise.all([
    listClients({ filter, search }),
    getClientDetail(clientId),
    listDraftsForClient(clientId),
    listFreshAlerts(),
  ]);
  if (!detail) notFound();

  return (
    <div className="view">
      <div className="crm-layout">
        <CrmSidebar
          clients={list}
          selectedClientId={clientId}
          activeFilter={filter}
          searchValue={search}
        />

        <main className="crm-main">
          <AlertBanner alerts={alerts} />
          <ProfileHeader client={detail.client} />
          <KpiStrip kpis={detail.kpis} />
          <ProfileTabs
            tripsData={detail.trips}
            preferences={detail.client.preferences}
            notes={detail.activity}
          />
        </main>

        <aside className="crm-right">
          <div className="crp-sec">
            <div className="crp-head">
              <div className="crp-lbl">AI Client Intelligence</div>
              <RegenerateInsightsButton clientId={detail.client.id} />
            </div>
            <AIIntelligence
              insights={detail.client.insights}
              clientId={detail.client.id}
            />
          </div>
          <div className="crp-sec">
            <div className="crp-lbl">Outreach Drafts</div>
            <OutreachDrafts drafts={drafts} clientId={detail.client.id} />
          </div>
          <div className="crp-sec">
            <div className="crp-lbl">Recent Activity</div>
            <ActivityFeed activity={detail.activity} />
          </div>
          <div className="crp-sec">
            <div className="crp-lbl">Quick Note</div>
            <QuickNote
              clientId={detail.client.id}
              clientName={detail.client.name}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
