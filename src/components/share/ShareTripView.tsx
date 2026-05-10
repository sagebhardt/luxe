import Image from "next/image";
import { formatDateRange, formatMoney, formatDayLabel } from "@/lib/format";
import type {
  trips,
  clients,
  bookings,
  agentLogMessages,
  tripAlerts,
  npsResponses,
} from "@/lib/db/schema";
import type { TripNarrative } from "@/lib/types/narrative";
import type { WeatherChip } from "@/lib/data/weather";
import { ClientChat } from "./ClientChat";
import { DayCard } from "./DayCard";
import { NpsForm } from "./NpsForm";

type Trip = typeof trips.$inferSelect & {
  client: typeof clients.$inferSelect;
  bookings: (typeof bookings.$inferSelect)[];
  log: (typeof agentLogMessages.$inferSelect)[];
  alerts: (typeof tripAlerts.$inferSelect)[];
};

type EventMeta = {
  time?: string;
  icon?: string;
  timelineName?: string;
  timelineDetail?: string;
  timelineCost?: number;
  approxCost?: boolean;
  surprise?: boolean;
};

type Phase = "before" | "during" | "after";

const NPS_WINDOW_DAYS = 60;

export function ShareTripView({
  trip,
  token,
  weather,
  nps,
}: {
  trip: Trip;
  token: string;
  weather: Record<string, WeatherChip>;
  nps: typeof npsResponses.$inferSelect | null;
}) {
  const narrative = (trip.clientNarrative ?? null) as TripNarrative | null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const phase = computePhase(trip.startDate, trip.endDate, todayIso);

  /* Surprise time-gating: if a booking is flagged metadata.surprise=true
   * and its occursOn is in the future, hide it entirely from the client
   * view. Once the day arrives it appears with a special label. */
  const visibleBookings = trip.bookings.filter((b) => {
    const meta = (b.metadata ?? {}) as EventMeta;
    if (meta.surprise === true && b.occursOn && b.occursOn > todayIso) {
      return false;
    }
    return true;
  });

  const featured = visibleBookings.filter((b) => {
    const meta = (b.metadata ?? {}) as Record<string, unknown>;
    if (meta.featured === true) return true;
    if (meta.time != null) return false;
    return b.status === "confirmed" || b.status === "pending";
  });

  const timeline = visibleBookings.filter(
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

  const dayList = [...days.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const dayCount = dayList.length;
  const tripLengthDays =
    trip.startDate && trip.endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(trip.endDate + "T00:00:00").getTime() -
              new Date(trip.startDate + "T00:00:00").getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1,
        )
      : 0;

  /* Today-first reorder: when underway, find today's date and rotate it
   * to the front so the client lands on the right day. We preserve the
   * original index so DayCard's "Day N of M" is still correct. */
  const todayIdx =
    phase === "during" ? dayList.findIndex(([date]) => date === todayIso) : -1;
  const orderedDayList: Array<{
    date: string;
    items: typeof timeline;
    originalIndex: number;
  }> = dayList.map(([date, items], originalIndex) => ({
    date,
    items,
    originalIndex,
  }));
  if (todayIdx > 0) {
    const [todayCard] = orderedDayList.splice(todayIdx, 1);
    orderedDayList.unshift(todayCard);
  }

  const visibleAlerts = trip.alerts.filter((a) => a.clientVisible);
  const showNpsForm =
    phase === "after" &&
    !nps &&
    trip.endDate != null &&
    daysSince(trip.endDate, todayIso) <= NPS_WINDOW_DAYS;

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

      {/* HERO IMAGE (when generated) */}
      {narrative?.hero ? (
        <div className="share-cover">
          <Image
            src={narrative.hero.imageUrl}
            alt={trip.destination}
            fill
            sizes="100vw"
            priority
            className="share-cover-img"
          />
          <div className="share-cover-veil" />
          <div className="share-cover-credit">
            Photo by{" "}
            <a
              href={narrative.hero.authorUrl + "?utm_source=luxe&utm_medium=referral"}
              target="_blank"
              rel="noreferrer"
            >
              {narrative.hero.authorName}
            </a>{" "}
            on{" "}
            <a
              href="https://unsplash.com?utm_source=luxe&utm_medium=referral"
              target="_blank"
              rel="noreferrer"
            >
              Unsplash
            </a>
          </div>
        </div>
      ) : null}

      <main className="share-main">
        {/* HERO */}
        <section className="share-hero">
          <div className="share-eyebrow">{eyebrow}</div>
          <h1 className="share-title">{trip.name}</h1>
          <Ornament />
          <p className="share-meta">
            {formatDateRange(trip.startDate, trip.endDate)} &nbsp;·&nbsp;{" "}
            {trip.travelerCount} traveler
            {trip.travelerCount === 1 ? "" : "s"} &nbsp;·&nbsp;{" "}
            {trip.destination}
          </p>
          {daysUntil != null ? (
            <div className="share-countdown">
              {phase === "after" ? (
                <span className="share-countdown-label">
                  Returned home
                </span>
              ) : daysUntil > 0 ? (
                <>
                  <span className="share-countdown-num">{daysUntil}</span>
                  <span className="share-countdown-label">
                    day{daysUntil === 1 ? "" : "s"} until departure
                  </span>
                </>
              ) : daysUntil === 0 ? (
                <span className="share-countdown-label">Departure today</span>
              ) : (
                <span className="share-countdown-label">
                  Underway · day {Math.abs(daysUntil) + 1}
                </span>
              )}
            </div>
          ) : null}
        </section>

        {/* MID-TRIP STATUS + LIVE NOTES */}
        {phase === "during" ? (
          <section className="share-section">
            <div className="share-phase">
              <div className="share-phase-label">Right now</div>
              <div className="share-phase-body">
                {phaseLine(trip.destination, daysUntil, tripLengthDays)}
              </div>
            </div>
            {visibleAlerts.length > 0 ? (
              <div className="share-notes">
                {visibleAlerts.map((a) => (
                  <div
                    key={a.id}
                    className={`share-note ${a.kind === "warn" ? "al-warn" : "al-info"}`}
                  >
                    <div className="share-note-icon" aria-hidden="true">
                      {a.icon ?? "✦"}
                    </div>
                    <div className="share-note-body">
                      <div className="share-note-from">
                        {a.signedBy ? (
                          <>
                            A note from <em>{a.signedBy}</em>
                          </>
                        ) : (
                          "A note from your designer"
                        )}
                      </div>
                      <div className="share-note-text">{a.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* OPENING NARRATIVE — front-loaded before the trip; tucked
         * after timeline once the trip is underway. */}
        {phase !== "during" ? (
          <>
            <section className="share-opening">
              <p className="share-opening-body">
                <span className="share-dropcap" aria-hidden="true">
                  {heroOpening.charAt(0)}
                </span>
                {heroOpening.slice(1)}
              </p>
            </section>
            <Ornament size="lg" />
          </>
        ) : null}

        {/* CONFIRMED ANCHORS */}
        <section className="share-section">
          <div className="share-section-eyebrow">What&rsquo;s secured</div>
          <h2 className="share-section-title">Your anchors</h2>
          {featured.length === 0 ? (
            <div className="share-empty">
              Your concierge is finalizing reservations. Check back soon —
              you&rsquo;ll see hotel and flight confirmations here as they&rsquo;re
              booked.
            </div>
          ) : (
            <div className="share-cards">
              {featured.map((b) => {
                const meta = (b.metadata ?? {}) as Record<string, unknown> &
                  EventMeta;
                const subtitle =
                  (meta.subtitle as string | undefined) ??
                  defaultSubtitle(b.kind);
                const isSurprise = meta.surprise === true;
                return (
                  <article
                    key={b.id}
                    className={`share-card${isSurprise ? " is-surprise" : ""}`}
                  >
                    {isSurprise ? (
                      <div className="share-card-surprise-tag">
                        A small touch
                      </div>
                    ) : null}
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

        <Ornament size="lg" />

        {/* DAY BY DAY — magazine layout */}
        <section className="share-section">
          <div className="share-section-eyebrow">
            {phase === "during" ? "Today and ahead" : "The rhythm"}
          </div>
          <h2 className="share-section-title">
            {phase === "during" ? "Where you are" : "Your days unfold"}
          </h2>
          {orderedDayList.length === 0 ? (
            <div className="share-empty">
              Day-by-day plan coming soon. Your concierge is mapping out
              timing, transfers, and reservations.
            </div>
          ) : (
            <div className="day-list">
              {orderedDayList.map(({ date, items, originalIndex }) => {
                const { num, dow } = formatDayLabel(date);
                const summary = narrative?.daySummaries?.[date];
                const w = weather[date] ?? null;
                return (
                  <DayCard
                    key={date}
                    index={originalIndex}
                    total={dayCount}
                    date={date}
                    dayNumber={num}
                    dayOfWeek={dow}
                    theme={summary?.theme ?? null}
                    blurb={summary?.blurb ?? null}
                    packingNote={summary?.packingNote ?? null}
                    weather={w}
                    eventDetails={summary?.eventDetails ?? {}}
                    events={items.map((b) => {
                      const meta = (b.metadata ?? {}) as EventMeta;
                      return {
                        id: b.id,
                        time: meta.time ?? "—",
                        icon: meta.icon ?? "•",
                        title: meta.timelineName ?? b.title,
                        detail: meta.timelineDetail ?? b.detail ?? null,
                        cost: meta.timelineCost ?? null,
                        approx: meta.approxCost === true,
                        surprise: meta.surprise === true,
                      };
                    })}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* OPENING NARRATIVE (during) */}
        {phase === "during" ? (
          <>
            <Ornament size="lg" />
            <section className="share-opening">
              <p className="share-opening-body">
                <span className="share-dropcap" aria-hidden="true">
                  {heroOpening.charAt(0)}
                </span>
                {heroOpening.slice(1)}
              </p>
            </section>
          </>
        ) : null}

        {/* PRE-TRIP NOTES */}
        {narrative?.preTripNotes && narrative.preTripNotes.length > 0 ? (
          <>
            <Ornament size="lg" />
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

        <Ornament size="lg" />

        {/* NPS POST-TRIP */}
        {showNpsForm ? (
          <NpsForm
            token={token}
            clientFirstName={firstName(trip.client.name)}
          />
        ) : nps ? (
          <section className="share-section">
            <div className="share-nps">
              <p className="share-nps-done">
                Thank you — your designer has your read on this trip.
              </p>
            </div>
          </section>
        ) : null}

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

function Ornament({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <div className={`share-ornament ${size === "lg" ? "lg" : "sm"}`} aria-hidden="true">
      <svg viewBox="0 0 80 8" width="80" height="8">
        <line x1="0" y1="4" x2="32" y2="4" stroke="currentColor" strokeWidth="1" />
        <circle cx="40" cy="4" r="2.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <line x1="48" y1="4" x2="80" y2="4" stroke="currentColor" strokeWidth="1" />
      </svg>
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

function daysSince(iso: string, todayIso: string): number {
  const today = new Date(todayIso + "T00:00:00").getTime();
  const past = new Date(iso + "T00:00:00").getTime();
  return Math.round((today - past) / (1000 * 60 * 60 * 24));
}

function computePhase(
  startDate: string | null,
  endDate: string | null,
  todayIso: string,
): Phase {
  if (!startDate || !endDate) return "before";
  if (todayIso < startDate) return "before";
  if (todayIso > endDate) return "after";
  return "during";
}

function phaseLine(
  destination: string,
  daysUntil: number | null,
  totalDays: number,
): string {
  if (daysUntil == null) return `In ${destination}`;
  const dayNumber = Math.abs(daysUntil) + 1;
  if (totalDays > 0) {
    return `Day ${dayNumber} of ${totalDays} · ${destination}`;
  }
  return `Day ${dayNumber} · ${destination}`;
}

function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full;
}
