import { formatDayLabel, formatMoney } from "@/lib/format";
import type { bookings } from "@/lib/db/schema";

type Booking = typeof bookings.$inferSelect;
type Meta = {
  time?: string;
  icon?: string;
  timelineName?: string;
  timelineDetail?: string;
  timelineCost?: number;
  approxCost?: boolean;
};

export function ItineraryTimeline({ bookings: rows }: { bookings: Booking[] }) {
  // Group by occursOn date in chronological order.
  const sorted = [...rows]
    .filter((b) => b.occursOn)
    .sort((a, b) => {
      const da = a.occursOn!;
      const db = b.occursOn!;
      if (da !== db) return da < db ? -1 : 1;
      const ta = ((a.metadata as Meta | null)?.time ?? "") || "";
      const tb = ((b.metadata as Meta | null)?.time ?? "") || "";
      return ta.localeCompare(tb);
    });

  const days = new Map<string, Booking[]>();
  for (const b of sorted) {
    const key = b.occursOn!;
    if (!days.has(key)) days.set(key, []);
    days.get(key)!.push(b);
  }

  return (
    <>
      {[...days.entries()].map(([date, items]) => {
        const { num, dow } = formatDayLabel(date);
        return (
          <div key={date} className="tl-day">
            <div className="tl-day-lbl">
              <div className="tl-num">{num}</div>
              <div className="tl-dow">{dow}</div>
            </div>
            <div className="tl-events">
              {items.map((b) => {
                const meta = (b.metadata ?? {}) as Meta;
                const cost =
                  meta.timelineCost != null
                    ? `${meta.approxCost ? "~" : ""}${formatMoney(meta.timelineCost * 100)}`
                    : null;
                return (
                  <div key={b.id} className="evt">
                    <div className="evt-time">{meta.time}</div>
                    <div className="evt-icon">{meta.icon}</div>
                    <div className="evt-body">
                      <div className="evt-name">
                        {meta.timelineName ?? b.title}
                      </div>
                      <div className="evt-detail">
                        {meta.timelineDetail ?? b.detail}
                      </div>
                    </div>
                    {cost ? <div className="evt-cost">{cost}</div> : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
