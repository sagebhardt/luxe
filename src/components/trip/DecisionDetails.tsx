"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

type ItineraryDays = {
  days?: {
    date: string;
    events: {
      time: string;
      icon: string;
      title: string;
      detail: string;
      estCostCents?: number;
    }[];
  }[];
};

type DiningCandidates = {
  candidates?: {
    name: string;
    cuisine: string;
    neighborhood: string;
    priceTier: string;
    why: string;
    bookingDifficulty: string;
  }[];
};

type FlightHotelRec = {
  carrier?: string;
  cabin?: string;
  hotelId?: string;
  nightlyCents?: number;
  nightsTotal?: number;
};

export function DecisionDetails({
  agent,
  recommendation,
}: {
  agent: "flight" | "hotel" | "itinerary" | "dining";
  recommendation: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="decision-details">
      <button
        type="button"
        className="appr-alts-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide" : "View"} details
      </button>
      {open ? (
        <div className="decision-details-body">
          {agent === "itinerary" ? (
            <ItineraryView rec={recommendation as ItineraryDays} />
          ) : agent === "dining" ? (
            <DiningView rec={recommendation as DiningCandidates} />
          ) : (
            <FlightHotelView rec={recommendation as FlightHotelRec} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function ItineraryView({ rec }: { rec: ItineraryDays }) {
  const days = rec.days ?? [];
  if (days.length === 0) return <em>No days returned.</em>;
  return (
    <ul className="itin-days">
      {days.map((d) => (
        <li key={d.date}>
          <div className="itin-date">
            {new Date(d.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
          <ul className="itin-events">
            {d.events.map((ev, i) => (
              <li key={i}>
                <span className="itin-time">{ev.time}</span>
                <span className="itin-icon">{ev.icon}</span>
                <span className="itin-title">{ev.title}</span>
                <span className="itin-detail">{ev.detail}</span>
                {ev.estCostCents != null ? (
                  <span className="itin-cost">
                    {formatMoney(ev.estCostCents)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

const DIFFICULTY_LABEL: Record<string, string> = {
  walk_in: "walk-in",
  weeks_ahead: "book weeks ahead",
  months_ahead: "book months ahead",
  concierge_only: "concierge only",
};

function DiningView({ rec }: { rec: DiningCandidates }) {
  const candidates = rec.candidates ?? [];
  if (candidates.length === 0) return <em>No candidates returned.</em>;
  return (
    <ul className="dining-list">
      {candidates.map((c, i) => (
        <li key={i}>
          <div className="dining-head">
            <span className="dining-name">{c.name}</span>
            <span className="dining-tier">{c.priceTier}</span>
          </div>
          <div className="dining-meta">
            {c.cuisine} · {c.neighborhood} ·{" "}
            <em>{DIFFICULTY_LABEL[c.bookingDifficulty] ?? c.bookingDifficulty}</em>
          </div>
          <div className="dining-why">{c.why}</div>
        </li>
      ))}
    </ul>
  );
}

function FlightHotelView({ rec }: { rec: FlightHotelRec }) {
  const lines: { label: string; value: string }[] = [];
  if (rec.carrier) lines.push({ label: "Carrier", value: rec.carrier });
  if (rec.cabin) lines.push({ label: "Cabin", value: rec.cabin });
  if (rec.hotelId) lines.push({ label: "Hotel ID", value: rec.hotelId });
  if (rec.nightlyCents != null)
    lines.push({ label: "Nightly", value: formatMoney(rec.nightlyCents) });
  if (rec.nightsTotal != null)
    lines.push({ label: "Nights", value: String(rec.nightsTotal) });
  if (lines.length === 0) return <em>No additional detail.</em>;
  return (
    <dl className="rec-detail">
      {lines.map((l) => (
        <div key={l.label}>
          <dt>{l.label}</dt>
          <dd>{l.value}</dd>
        </div>
      ))}
    </dl>
  );
}
