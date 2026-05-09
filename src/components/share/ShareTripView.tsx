import { formatDateRange, formatMoney, formatDayLabel } from "@/lib/format";
import type {
  trips,
  clients,
  bookings,
  agentLogMessages,
} from "@/lib/db/schema";
import type { TripNarrative } from "@/lib/types/narrative";
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
  const narrative = (trip.clientNarrative ?? null) as TripNarrative | null;

  const featured = trip.bookings.filter((b) => {
    const meta = (b.metadata ?? {}) as Record<string, unknown>;
    if (meta.featured === true) return true;
    if (meta.time != null) return false;
    return b.status === "confirmed" || b.status === "pending";
  });

  const timeline = trip.bookings.filter(
    (b) => (b.metadata as EventMeta | null)?.time != null,
  );

  const days = new Map<string, typeof timeline>();
  for (const b of timeline) {
    if (!b.occursOn) continue;
    const list = days.get(b.occursOn) ?? [];
    list.push(b);
    days.set(b.occursOn, list);
  }

  const daysUntil = trip.startDate ? daysFromNow(trip.startDate) : null;
  const eyebrow = narrative?.heroEyebrow ?? "Your trip";
  const heroOpening =
    narrative?.heroOpening ??
    `${trip.destination} awaits. We've shaped a journey around what you've told us matters — pace, place, and the small details that turn a trip into a story.`;

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
        {/* HERO */}
        <section className="share-hero">
          <div className="share-eyebrow">{eyebrow}</div>
          <h1 className="share-title">{trip.name}</h1>
          <div className="share-rule" aria-hidden="true" />
          <p className="share-meta">
            {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp;{" "}
            {trip.travelerCount} traveler
            {trip.travelerCount === 1 ? "" : "s"} &nbsp;·&nbsp;{" "}
            {trip.destination}
          </p>
          {daysUntil != null ? (
            <div className="share-countdown">
              {daysUntil > 0 ? (
                <>
                  <span className="share-countdown-num">{daysUntil}</span>
                  <span className="share-countdown-label">
                    day{daysUntil === 1 ? "" : "s"} until departure
                  </span>
                </>
              ) : daysUntil === 0 ? (
                <span className="share-countdown-label">
                  Departure today
                </span>
              ) : (
                <span className="share-countdown-label">
                  Underway · day {Math.abs(daysUntil) + 1}
                </span>
              )}
            </div>
          ) : null}
        </section>

        {/* OPENING NARRATIVE — drop cap, editorial */}
        <section className="share-opening">
          <p className="share-opening-body">
            <span className="share-dropcap" aria-hidden="true">
              {heroOpening.charAt(0)}
            </span>
            {heroOpening.slice(1)}
          </p>
        </section>

        <div className="share-divider" aria-hidden="true" />

        {/* CONFIRMED ANCHORS */}
        <section className="share-section">
          <div className="share-section-eyebrow">What's secured</div>
          <h2 className="share-section-title">Your anchors</h2>
          {featured.length === 0 ? (
            <div className="share-empty">
              Your concierge is finalizing reservations. Check back soon —
              you'll see hotel and flight confirmations here as they're
              booked.
            </div>
          ) : (
            <div className="share-cards">
              {featured.map((b) => {
                const meta = (b.metadata ?? {}) as Record<string, unknown>;
                const subtitle =
                  (meta.subtitle as string | undefined) ??
                  defaultSubtitle(b.kind);
                return (
                  <article key={b.id} className="share-card">
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
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="share-divider" aria-hidden="true" />

        {/* DAY BY DAY — with optional themes */}
        <section className="share-section">
          <div className="share-section-eyebrow">The rhythm</div>
          <h2 className="share-section-title">Your days unfold</h2>
          {days.size === 0 ? (
            <div className="share-empty">
              Day-by-day plan coming soon. Your concierge is mapping out
              timing, transfers, and reservations.
            </div>
          ) : (
            [...days.entries()].map(([date, items]) => {
              const { num, dow } = formatDayLabel(date);
              const summary = narrative?.daySummaries?.[date];
              return (
                <div key={date} className="share-day">
                  <div className="share-day-lbl">
                    <div className="share-day-num">{num}</div>
                    <div className="share-day-dow">{dow}</div>
                  </div>
                  <div className="share-day-content">
                    {summary ? (
                      <>
                        <div className="share-day-theme">{summary.theme}</div>
                        <p className="share-day-blurb">{summary.blurb}</p>
                      </>
                    ) : null}
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
                </div>
              );
            })
          )}
        </section>

        {/* PRE-TRIP NOTES — only if narrative is generated */}
        {narrative?.preTripNotes && narrative.preTripNotes.length > 0 ? (
          <>
            <div className="share-divider" aria-hidden="true" />
            <section className="share-section">
              <div className="share-section-eyebrow">Before you go</div>
              <h2 className="share-section-title">A few quiet notes</h2>
              <div className="share-pre-grid">
                {narrative.preTripNotes.map((n, i) => (
                  <div key={i} className="share-pre-card">
                    <div className="share-pre-label">{n.label}</div>
                    <p className="share-pre-body">{n.body}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        <div className="share-divider" aria-hidden="true" />

        {/* CLOSING + CHAT */}
        <section className="share-section share-close">
          <div className="share-section-eyebrow">Stay in touch</div>
          <h2 className="share-section-title">Reach me anytime</h2>
          <p className="share-closing">
            {narrative?.closing ??
              "Your concierge agent has the full picture of your trip and can answer almost anything in real time. For changes or anything sensitive, your operator picks up where the agent leaves off."}
          </p>
          <ClientChat
            tripId={trip.id}
            token={token}
            initialMessages={trip.log}
          />
        </section>
      </main>

      <footer className="share-footer">
        Curated by Luxe — questions outside this thread? Reply to your
        concierge directly.
      </footer>
    </div>
  );
}

function defaultSubtitle(kind: string): string {
  switch (kind) {
    case "hotel":
      return "Hotel";
    case "flight":
      return "Flight";
    case "dining":
      return "Dining";
    case "experience":
      return "Experience";
    case "transfer":
      return "Transfer";
    default:
      return "Booking";
  }
}

function daysFromNow(iso: string): number {
  const now = new Date();
  const target = new Date(iso + "T00:00:00");
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
