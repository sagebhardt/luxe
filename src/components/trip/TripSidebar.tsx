import Link from "next/link";
import type { SidebarTrip } from "@/lib/queries/trips";
import type { travelerPreferences, clients } from "@/lib/db/schema";

type Preferences = typeof travelerPreferences.$inferSelect | null;
type Client = typeof clients.$inferSelect;

const STATUS_DOT: Record<SidebarTrip["status"], string> = {
  active: "sd-active",
  pending: "sd-pending",
  draft: "sd-pending",
  completed: "sd-done",
  archived: "sd-done",
};

export function TripSidebar({
  activeTrips,
  completedTrips,
  selectedTripId,
  preferences,
  client,
}: {
  activeTrips: SidebarTrip[];
  completedTrips: SidebarTrip[];
  selectedTripId: string;
  preferences: Preferences;
  client: Client;
}) {
  return (
    <aside className="sidebar">
      <div className="sb-section">
        <div className="sb-label">Active Trips</div>
        {activeTrips.map((t) => (
          <Link
            key={t.id}
            href={`/trip?id=${t.id}`}
            className={`trip-row${t.id === selectedTripId ? " sel" : ""}`}
          >
            <div className="tr-name">
              <span className={`status-dot ${STATUS_DOT[t.status]}`} />
              {t.name}
            </div>
            <div className="tr-sub">{t.subtitle}</div>
          </Link>
        ))}
      </div>

      <div className="sb-section">
        <div className="sb-label">Completed</div>
        {completedTrips.map((t) => (
          <Link
            key={t.id}
            href={`/trip?id=${t.id}`}
            className={`trip-row${t.id === selectedTripId ? " sel" : ""}`}
          >
            <div className="tr-name">
              <span className={`status-dot ${STATUS_DOT[t.status]}`} />
              {t.name}
            </div>
            <div className="tr-sub">{t.subtitle}</div>
          </Link>
        ))}
      </div>

      <div className="sb-section">
        <div className="sb-label">Traveler Profile</div>
        <Link
          href={`/clients?id=${client.id}`}
          className="sb-client-link"
        >
          <span className={`client-av sb-client-av ${client.avatarColor ?? "av-3"}`}>
            {client.name.charAt(0)}
          </span>
          <div>
            <div className="sb-client-name">{client.name}</div>
            <div className="sb-client-hint">View profile →</div>
          </div>
        </Link>
        <div className="pref-list">
          <PreferenceLines preferences={preferences} />
        </div>
      </div>
    </aside>
  );
}

function PreferenceLines({ preferences }: { preferences: Preferences }) {
  if (!preferences) return <>— No preferences on file</>;
  const lines: string[] = [];
  if (preferences.flightClass) {
    lines.push(
      `${capitalize(preferences.flightClass)} / First class`.replace(
        / \/ First class$/,
        preferences.flightClass === "business" ? " / First class" : "",
      ),
    );
  }
  if (preferences.hotelStyle) {
    lines.push(
      preferences.hotelStyle === "boutique"
        ? "Boutique hotels only"
        : `${capitalize(preferences.hotelStyle)} hotels`,
    );
  }
  if (preferences.diningStyle) {
    lines.push(capitalize(preferences.diningStyle));
  }
  if (preferences.pacePreference) {
    lines.push(capitalize(preferences.pacePreference));
  }
  if (preferences.seatPreference) {
    lines.push(`${capitalize(preferences.seatPreference)} seat`);
  }
  const budget = (preferences.extras as Record<string, unknown> | null)
    ?.budgetTypical;
  if (typeof budget === "number") {
    lines.push(`Budget $${budget.toLocaleString("en-US")}`);
  }
  return (
    <>
      {lines.map((line) => (
        <span key={line}>
          — {line}
          <br />
        </span>
      ))}
    </>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
