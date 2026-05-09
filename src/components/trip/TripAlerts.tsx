import type { tripAlerts } from "@/lib/db/schema";

type Alert = typeof tripAlerts.$inferSelect;

export function TripAlerts({ alerts }: { alerts: Alert[] }) {
  return (
    <div>
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`alert-strip ${a.kind === "warn" ? "al-warn" : "al-info"}`}
        >
          <div>{a.icon}</div>
          <div>{a.body}</div>
        </div>
      ))}
    </div>
  );
}
