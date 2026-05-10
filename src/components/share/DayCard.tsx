import { formatMoney } from "@/lib/format";
import type { WeatherChip } from "@/lib/data/weather";
import type { EventEnrichment } from "@/lib/types/narrative";

type Event = {
  id: string;
  time: string;
  icon: string;
  title: string;
  detail: string | null;
  cost: number | null;
  approx: boolean;
  surprise?: boolean;
};

const KIND_ORNAMENTS = ["✦", "❋", "✧", "❉", "✺"] as const;

export function DayCard({
  index,
  total,
  date,
  dayNumber,
  dayOfWeek,
  theme,
  blurb,
  packingNote,
  weather,
  events,
  eventDetails,
}: {
  index: number;
  total: number;
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  theme: string | null;
  blurb: string | null;
  packingNote: string | null;
  weather: WeatherChip | null;
  events: Event[];
  eventDetails: Record<string, EventEnrichment>;
}) {
  const ornament = KIND_ORNAMENTS[index % KIND_ORNAMENTS.length];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <article className="day-card">
      <header className="day-head">
        <div className="day-numeral">
          <div className="day-numeral-glyph" aria-hidden="true">
            {ornament}
          </div>
          <div className="day-numeral-num">
            {String(dayNumber).padStart(2, "0")}
          </div>
          <div className="day-numeral-dow">{dayOfWeek}</div>
          <div className="day-numeral-step">
            Day {index + 1} of {total}
            {isFirst ? " · arrival" : isLast ? " · departure" : ""}
          </div>
        </div>

        <div className="day-meta">
          {theme ? <h3 className="day-theme">{theme}</h3> : null}
          {weather ? (
            <div className="day-weather">
              <span className="day-weather-glyph" aria-hidden="true">
                {weather.glyph}
              </span>
              <div>
                <div className="day-weather-temp">
                  {Math.round(weather.highC)}°
                  <span className="day-weather-low">
                    /{Math.round(weather.lowC)}°
                  </span>
                </div>
                <div className="day-weather-label">
                  {weather.label}
                  <span className="day-weather-source">
                    {weather.source === "forecast" ? "live forecast" : "seasonal avg"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      {blurb ? <p className="day-blurb">{blurb}</p> : null}

      {packingNote ? (
        <div className="day-packing">
          <div className="day-packing-label">For today</div>
          <div className="day-packing-body">{packingNote}</div>
        </div>
      ) : null}

      <ol className="day-events">
        {events.map((ev) => {
          const enrich = eventDetails[ev.title] ?? null;
          return (
            <li
              key={ev.id}
              className={`day-evt${ev.surprise ? " is-surprise" : ""}`}
            >
              <span className="day-evt-line" aria-hidden="true" />
              <div className="day-evt-time">{ev.time}</div>
              <div className="day-evt-icon" aria-hidden="true">
                {ev.icon}
              </div>
              <div className="day-evt-body">
                {ev.surprise ? (
                  <div className="share-evt-surprise-tag">A small touch</div>
                ) : null}
                <div className="day-evt-name">{ev.title}</div>
                {ev.detail ? (
                  <div className="day-evt-detail">{ev.detail}</div>
                ) : null}

                {enrich ? (
                  <div className="day-evt-enrich">
                    <p className="day-evt-lede">{enrich.lede}</p>
                    <p className="day-evt-body-copy">{enrich.body}</p>
                    {enrich.facts && enrich.facts.length > 0 ? (
                      <dl className="day-evt-facts">
                        {enrich.facts.map((f, i) => (
                          <div key={i} className="day-evt-fact">
                            <dt>{f.label}</dt>
                            <dd>{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {ev.cost != null ? (
                <div className="day-evt-cost">
                  {ev.approx ? "~" : ""}
                  {formatMoney(ev.cost * 100)}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      {!isLast ? (
        <div className="day-divider" aria-hidden="true">
          <svg viewBox="0 0 80 12" width="80" height="12">
            <line
              x1="40"
              y1="0"
              x2="40"
              y2="12"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          </svg>
        </div>
      ) : null}
      <span className="sr-only">{date}</span>
    </article>
  );
}
