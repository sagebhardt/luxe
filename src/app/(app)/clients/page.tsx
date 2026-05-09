import { notFound } from "next/navigation";
import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { ProfileHeader } from "@/components/crm/ProfileHeader";
import { KpiStrip } from "@/components/crm/KpiStrip";
import { InnerTabs } from "@/components/crm/InnerTabs";
import { TripsTable } from "@/components/crm/TripsTable";
import { AIIntelligence } from "@/components/crm/AIIntelligence";
import { RegenerateInsightsButton } from "@/components/crm/RegenerateInsightsButton";
import { OutreachDrafts } from "@/components/crm/OutreachDrafts";
import { listDraftsForClient } from "@/lib/queries/outreach";
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
  return (
    FILTERS.find((f) => f === value) ?? ("all" as ClientFilter)
  );
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

  const [list, detail, drafts] = await Promise.all([
    listClients({ filter, search }),
    getClientDetail(clientId),
    listDraftsForClient(clientId),
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
          <ProfileHeader client={detail.client} />
          <KpiStrip kpis={detail.kpis} />
          <InnerTabs />
          <TripsTable trips={detail.trips} />
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
            <QuickNote clientName={detail.client.name} />
          </div>
        </aside>
      </div>
    </div>
  );
}
