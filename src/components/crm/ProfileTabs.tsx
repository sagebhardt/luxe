"use client";

import { useState } from "react";
import { TripsTable } from "./TripsTable";
import { PreferencesPanel } from "./PreferencesPanel";
import { NotesAndCallsPanel } from "./NotesAndCallsPanel";
import { DocumentsPanel } from "./DocumentsPanel";
import type {
  trips,
  agentRuns,
  travelerPreferences,
  activityLog,
  documents,
} from "@/lib/db/schema";

const TABS = ["Trip History", "Preferences", "Notes & Calls", "Documents"] as const;

type TripWithAgents = typeof trips.$inferSelect & {
  agentRuns: Pick<typeof agentRuns.$inferSelect, "agent" | "status">[];
};

export function ProfileTabs({
  clientId,
  tripsData,
  preferences,
  notes,
  documents: docs,
  blobConfigured,
}: {
  clientId: string;
  tripsData: TripWithAgents[];
  preferences: typeof travelerPreferences.$inferSelect | null;
  notes: (typeof activityLog.$inferSelect)[];
  documents: (typeof documents.$inferSelect)[];
  blobConfigured: boolean;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Trip History");

  return (
    <div className="profile-tabs">
      <div className="inner-tabs">
        {TABS.map((t) => {
          const isDocs = t === "Documents";
          const count = isDocs ? docs.length : null;
          return (
            <button
              key={t}
              type="button"
              className={`itab${t === active ? " active" : ""}`}
              onClick={() => setActive(t)}
            >
              {t}
              {count != null && count > 0 ? (
                <span className="itab-count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {active === "Trip History" ? <TripsTable trips={tripsData} /> : null}
      {active === "Preferences" ? (
        <PreferencesPanel preferences={preferences} />
      ) : null}
      {active === "Notes & Calls" ? <NotesAndCallsPanel notes={notes} /> : null}
      {active === "Documents" ? (
        <DocumentsPanel
          clientId={clientId}
          documents={docs}
          blobConfigured={blobConfigured}
        />
      ) : null}
    </div>
  );
}
