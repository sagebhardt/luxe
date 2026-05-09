import { formatDateRange, formatMoney, formatDayLabel } from "@/lib/format";
import type {
  trips,
  clients,
  bookings,
  agentLogMessages,
} from "@/lib/db/schema";
import { ClientChat } from "./ClientChat";

type Trip = typeof trips.$inferSelect & {
  client: typeof clients.$inferSelect;
  bookings: (typeof bookings.$inferSelect)[];
  log: (typeof agentLogMessages.$inferSelect)[];
};

type EventMeta = {
  time?: string;
  icon?: string;
  timelineName?: string;
  timelineDetail?: string;
  timelineCost?: number;
  approxCost?: boolean;
};

export function ShareTripView({ trip, token }: { trip: Trip; token: string }) {
  const featured = trip.bookings.filter(
    (b) => (b.metadata as Record<string, unknown> | null)?.featured === true,
  );
  const timeline = trip.bookings.filter(
    (b) => (b.metadata as EventMeta | null)?.time != null,
  );

  /* Group timeline events by day */
  const days = new Map<string, typeof timeline>();
  for (const b of timeline) {
    if (!b.occursOn) continue;
    const list = days.get(b.occursOn) ?? [];
    list.push(b);
    days.set(b.occursOn, list);
  }

  return (
    <div className="share-shell">
      <header className="share-nav">
        <div className="wordmark">
          Luxe<sup>AI</sup>
        </div>
        <div className="share-nav-meta">
          For <em>{trip.client.name}</em>
        </div>
      </header>

      <main className="share-main">
        <section className="share-hero">
          <div className="share-eyebrow">Your trip</div>
          <h1 className="share-title">{trip.name}</h1>
          <p className="share-meta">
            {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp;{" "}
            {trip.travelerCount} traveler
            {trip.travelerCount === 1 ? "" : "s"} &nbsp;·&nbsp;{" "}
            {trip.destination}
          </p>
        </section>

        {featured.length > 0 ? (
          <section className="share-section">
            <div className="share-section-label">Confirmed for you</div>
            <div className="share-cards">
              {featured.map((b) => {
                const meta = (b.metadata ?? {}) as Record<string, unknown>;
                const subtitle = (meta.subtitle as string | undefined) ?? "";
                return (
                  <div key={b.id} className="share-card">
                    <div className="share-card-tag">{subtitle}</div>
                    <div className="share-card-name">{b.title}</div>
                    {b.detail ? (
                      <div className="share-card-detail">
                        {b.detail.split("\n").map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {b.priceCents != null ? (
                      <div className="share-card-price">
                        {formatMoney(b.priceCents)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {days.size > 0 ? (
          <section className="share-section">
            <div className="share-section-label">Day by day</div>
            {[...days.entries()].map(([date, items]) => {
              const { num, dow } = formatDayLabel(date);
              return (
                <div key={date} className="share-day">
                  <div className="share-day-lbl">
                    <div className="share-day-num">{num}</div>
                    <div className="share-day-dow">{dow}</div>
                  </div>
                  <div className="share-day-events">
                    {items.map((b) => {
                      const meta = (b.metadata ?? {}) as EventMeta;
                      return (
                        <div key={b.id} className="share-evt">
                          <span className="share-evt-time">{meta.time}</span>
                          <span className="share-evt-icon">{meta.icon}</span>
                          <div className="share-evt-body">
                            <div className="share-evt-name">
                              {meta.timelineName ?? b.title}
                            </div>
                            <div className="share-evt-detail">
                              {meta.timelineDetail ?? b.detail}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        <section className="share-section">
          <div className="share-section-label">Ask anything</div>
          <p className="share-hint">
            Your concierge agent has the full picture of your trip. Ask about
            timing, the hotels, what to pack — anything.
          </p>
          <ClientChat
            tripId={trip.id}
            token={token}
            initialMessages={trip.log}
          />
        </section>
      </main>

      <footer className="share-footer">
        Curated by Luxe — questions? Reply to this thread or email your
        concierge directly.
      </footer>
    </div>
  );
}
