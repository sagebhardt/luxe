"use client";

import { useEffect, useState } from "react";

type Tick = {
  agent: string;
  body: string;
  kind: "orch" | "sub" | "warn" | "ok";
};

/* Scripted agent activity feed for the hero. Loops every ~36 seconds.
 * Each message slides in with a stagger. Times are computed live so
 * the timestamps look like "now". */
const SCRIPT: Tick[] = [
  {
    agent: "Hotel Agent",
    body: "Aman Tokyo recomendado sobre 3 alternativas. Match con preferencia de boutique + piscina interior.",
    kind: "sub",
  },
  {
    agent: "Flight Agent",
    body: "JL011 + JL010 en F clase. Llegada matinal, aprobado por la ITD.",
    kind: "ok",
  },
  {
    agent: "Itinerary",
    body: "Reserva en Sazenka, día 4 — confirmada con 21 días de anticipación.",
    kind: "sub",
  },
  {
    agent: "Monitor",
    body: "Pasaporte de Marcela vence en 87 días — alertar antes del próximo viaje.",
    kind: "warn",
  },
  {
    agent: "Client CRM",
    body: "Lucia muestra señal de re-booking — sugerido outreach esta semana.",
    kind: "orch",
  },
  {
    agent: "Document Vault",
    body: "Voucher de Aman Bali extraído: booking ref AM-748291, total USD 18,400.",
    kind: "sub",
  },
  {
    agent: "Outreach",
    body: "Borrador de email a Diego sobre Marruecos en octubre — listo para revisar.",
    kind: "orch",
  },
  {
    agent: "Margin",
    body: "Día 6 cotizado — margen estimado 32%, FX bloqueado al confirmar.",
    kind: "ok",
  },
];

const KIND_AVATAR: Record<Tick["kind"], { glyph: string; cls: string }> = {
  orch: { glyph: "✦", cls: "pml-orch" },
  sub: { glyph: "⚙", cls: "pml-sub" },
  warn: { glyph: "⚠", cls: "pml-warn" },
  ok: { glyph: "✓", cls: "pml-ok" },
};

export function HeroAgentTicker() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [tickStart, setTickStart] = useState(() => new Date());

  /* Reveal one message every 1.6s. Once all are shown, hold for 4s,
   * then reset and replay. */
  useEffect(() => {
    if (visibleCount < SCRIPT.length) {
      const t = setTimeout(() => setVisibleCount((n) => n + 1), 1600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisibleCount(0);
      setTickStart(new Date());
    }, 6000);
    return () => clearTimeout(t);
  }, [visibleCount]);

  const visible = SCRIPT.slice(0, visibleCount).reverse();

  return (
    <div className="hero-ticker">
      <div className="hero-ticker-head">
        <span className="hero-ticker-dot" />
        <span className="hero-ticker-label">
          Agentes activos · ahora mismo
        </span>
      </div>
      <ul className="hero-ticker-list">
        {visible.map((t, idx) => {
          const av = KIND_AVATAR[t.kind];
          const time = new Date(
            tickStart.getTime() - idx * 60_000,
          );
          const hh = time.getHours().toString().padStart(2, "0");
          const mm = time.getMinutes().toString().padStart(2, "0");
          return (
            <li
              key={`${visibleCount}-${idx}`}
              className="hero-ticker-row"
              style={{ animationDelay: `${idx === 0 ? 0 : 0}ms` }}
            >
              <span className={`pml-avatar ${av.cls}`}>{av.glyph}</span>
              <div className="hero-ticker-content">
                <div className="hero-ticker-agent">{t.agent}</div>
                <div className="hero-ticker-body">{t.body}</div>
              </div>
              <span className="hero-ticker-time">
                {hh}:{mm}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
