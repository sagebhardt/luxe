import type { travelerPreferences } from "@/lib/db/schema";

type Prefs = typeof travelerPreferences.$inferSelect | null;

export function PreferencesPanel({ preferences }: { preferences: Prefs }) {
  if (!preferences) {
    return (
      <div className="tab-empty">
        <p>
          No traveler profile on file yet. Once preferences are captured —
          flight class, hotel style, dietary needs, pace — they'll guide every
          agent recommendation automatically.
        </p>
      </div>
    );
  }

  const groups: { label: string; rows: { label: string; value: string }[] }[] = [
    {
      label: "Flying",
      rows: filterRows([
        { label: "Class", value: cap(preferences.flightClass) },
        { label: "Seat", value: cap(preferences.seatPreference) },
      ]),
    },
    {
      label: "Stays",
      rows: filterRows([
        { label: "Hotel style", value: cap(preferences.hotelStyle) },
        { label: "Pace", value: cap(preferences.pacePreference) },
      ]),
    },
    {
      label: "Dining",
      rows: filterRows([
        { label: "Style", value: cap(preferences.diningStyle) },
        {
          label: "Dietary",
          value:
            preferences.dietaryRestrictions?.length
              ? preferences.dietaryRestrictions.join(", ")
              : "—",
        },
      ]),
    },
    {
      label: "Destinations",
      rows: filterRows([
        {
          label: "Interests",
          value:
            preferences.preferredDestinations?.length
              ? preferences.preferredDestinations.join(", ")
              : "—",
        },
      ]),
    },
  ].filter((g) => g.rows.length > 0);

  if (groups.length === 0) {
    return (
      <div className="tab-empty">
        <p>Preferences row exists but every field is empty. Capture details on the next call.</p>
      </div>
    );
  }

  return (
    <div className="prefs-grid">
      {groups.map((g) => (
        <div key={g.label} className="prefs-group">
          <div className="prefs-group-label">{g.label}</div>
          <dl className="prefs-list">
            {g.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function cap(v: string | null | undefined): string {
  if (!v) return "—";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function filterRows<T extends { value: string }>(rows: T[]): T[] {
  return rows.filter((r) => r.value && r.value !== "—");
}
