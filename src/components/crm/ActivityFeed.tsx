import { formatRelative } from "@/lib/format";
import type { activityLog } from "@/lib/db/schema";

type Item = typeof activityLog.$inferSelect;

export function ActivityFeed({ activity }: { activity: Item[] }) {
  return (
    <>
      {activity.map((a) => {
        const detail = (a.detail ?? {}) as { icon?: string };
        return (
          <div key={a.id} className="activity-item">
            <div className="act-icon">{detail.icon ?? "•"}</div>
            <div className="act-body">
              <div
                className="act-text"
                dangerouslySetInnerHTML={{ __html: a.summary }}
              />
              <div className="act-time">
                {formatRelative(new Date(a.occurredAt))}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
