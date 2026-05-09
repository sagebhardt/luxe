import Link from "next/link";
import { ClientFilters } from "./ClientFilters";
import { CrmSearchBox } from "./CrmSearchBox";
import { AskCrm } from "./AskCrm";
import { NewClientButton } from "./NewClientButton";
import { formatMoneyShort } from "@/lib/format";
import type { ClientFilter } from "@/lib/queries/clients";
import type { clients as clientsTable } from "@/lib/db/schema";

type ClientLike = typeof clientsTable.$inferSelect;

type ClientRow = Pick<
  ClientLike,
  "id" | "name" | "tag" | "avatarColor" | "lifetimeValueCents" | "notes"
> & {
  subtitle?: string;
  initial?: string;
};

const TAG_CLASS: Record<ClientRow["tag"], string> = {
  vip: "tag-vip",
  active: "tag-active",
  prospect: "tag-cold",
  dormant: "tag-cold",
};

const TAG_LABEL: Record<ClientRow["tag"], string> = {
  vip: "VIP",
  active: "Active",
  prospect: "Prospect",
  dormant: "Dormant",
};

export function CrmSidebar({
  clients: rows,
  selectedClientId,
  activeFilter,
  searchValue,
}: {
  clients: ClientRow[];
  selectedClientId: string | null;
  activeFilter: ClientFilter;
  searchValue: string;
}) {
  return (
    <aside className="crm-sb">
      <div className="crm-sb-top">
        <CrmSearchBox initial={searchValue} />
        <div className="crm-sb-actions">
          <NewClientButton />
          <AskCrm />
        </div>
      </div>
      <ClientFilters active={activeFilter} />
      <div className="client-list">
        {rows.map((c) => {
          const initial = c.initial ?? c.name.charAt(0);
          const ltv = formatMoneyShort(c.lifetimeValueCents) || "—";
          const subtitle = c.subtitle ?? "";
          const colorClass = c.avatarColor ?? "av-3";
          return (
            <Link
              key={c.id}
              href={`/clients?id=${c.id}${
                activeFilter !== "all" ? `&filter=${activeFilter}` : ""
              }`}
              className={`client-row${c.id === selectedClientId ? " sel" : ""}`}
            >
              <div className={`client-av ${colorClass}`}>{initial}</div>
              <div className="client-info">
                <div className="client-name">{c.name}</div>
                <div className="client-sub">{subtitle}</div>
              </div>
              <div className="client-right">
                <div className="client-ltv">{c.lifetimeValueCents ? ltv : "—"}</div>
                <span className={`client-tag ${TAG_CLASS[c.tag]}`}>
                  {TAG_LABEL[c.tag]}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
