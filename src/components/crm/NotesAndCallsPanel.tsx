import { formatRelative } from "@/lib/format";
import type { activityLog } from "@/lib/db/schema";

type Item = typeof activityLog.$inferSelect;

const ICONS: Record<string, string> = {
  note: "📝",
  call: "📞",
  email: "✉️",
  review: "⭐",
};

export function NotesAndCallsPanel({ notes }: { notes: Item[] }) {
  const filtered = notes.filter(
    (n) => n.type === "note" || n.type === "call" || n.type === "email" || n.type === "review",
  );
  if (filtered.length === 0) {
    return (
      <div className="tab-empty">
        <p>
          No notes or calls logged yet. Save a note from the right panel, or
          import call records to see history here.
        </p>
      </div>
    );
  }
  return (
    <ul className="notes-list">
      {filtered.map((n) => (
        <li key={n.id} className="notes-item">
          <div className="notes-icon">{ICONS[n.type] ?? "•"}</div>
          <div className="notes-body">
            <div
              className="notes-summary"
              dangerouslySetInnerHTML={{ __html: n.summary }}
            />
            <div className="notes-meta">
              <span className="notes-type">{n.type}</span>
              <span>·</span>
              <span>{n.actor ?? "system"}</span>
              <span>·</span>
              <span>{formatRelative(new Date(n.occurredAt))}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
