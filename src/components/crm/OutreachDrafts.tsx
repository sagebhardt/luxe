import { DraftOutreachLink } from "./DraftOutreachLink";
import { DraftCard } from "./DraftCard";
import type { outreachDrafts } from "@/lib/db/schema";

type Draft = typeof outreachDrafts.$inferSelect;

export function OutreachDrafts({
  drafts,
  clientId,
}: {
  drafts: Draft[];
  clientId: string;
}) {
  const visible = drafts.filter((d) => d.status !== "discarded");
  return (
    <div>
      <div className="drafts-toolbar">
        <DraftOutreachLink clientId={clientId} />
      </div>
      {visible.length === 0 ? (
        <div className="drafts-empty">
          No drafts yet. Click <em>draft outreach</em> on an insight (or on
          this section) to generate one.
        </div>
      ) : (
        <div className="drafts-list">
          {visible.map((d) => (
            <DraftCard key={d.id} draft={d} />
          ))}
        </div>
      )}
    </div>
  );
}
