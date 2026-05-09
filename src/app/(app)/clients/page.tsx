import { notFound } from "next/navigation";
import { CrmSidebar } from "@/components/crm/CrmSidebar";
import { ProfileHeader } from "@/components/crm/ProfileHeader";
import { KpiStrip } from "@/components/crm/KpiStrip";
import { InnerTabs } from "@/components/crm/InnerTabs";
import { TripsTable } from "@/components/crm/TripsTable";
import { AIIntelligence } from "@/components/crm/AIIntelligence";
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

  const [list, detail] = await Promise.all([
    listClients({ filter, search }),
    getClientDetail(clientId),
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
            <div className="crp-lbl">AI Client Intelligence</div>
            <AIIntelligence insights={detail.client.insights} />
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
