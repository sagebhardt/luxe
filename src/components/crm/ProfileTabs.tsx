"use client";

import { useState } from "react";
import { TripsTable } from "./TripsTable";
import { PreferencesPanel } from "./PreferencesPanel";
import { NotesAndCallsPanel } from "./NotesAndCallsPanel";
import type {
  trips,
  agentRuns,
  travelerPreferences,
  activityLog,
} from "@/lib/db/schema";

const TABS = ["Trip History", "Preferences", "Notes & Calls", "Documents"] as const;

type TripWithAgents = typeof trips.$inferSelect & {
  agentRuns: Pick<typeof agentRuns.$inferSelect, "agent" | "status">[];
};

export function ProfileTabs({
  tripsData,
  preferences,
  notes,
}: {
  tripsData: TripWithAgents[];
  preferences: typeof travelerPreferences.$inferSelect | null;
  notes: (typeof activityLog.$inferSelect)[];
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>("Trip History");

  return (
    <div className="profile-tabs">
      <div className="inner-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`itab${t === active ? " active" : ""}`}
            onClick={() => setActive(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {active === "Trip History" ? <TripsTable trips={tripsData} /> : null}
      {active === "Preferences" ? (
        <PreferencesPanel preferences={preferences} />
      ) : null}
      {active === "Notes & Calls" ? <NotesAndCallsPanel notes={notes} /> : null}
      {active === "Documents" ? (
        <div className="tab-empty">
          <p>
            No documents uploaded yet. Passport scans, visa confirmations, and
            booking PDFs will appear here.
          </p>
        </div>
      ) : null}
    </div>
  );
}
