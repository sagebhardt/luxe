/**
 * Visual mockups of Luxe's actual app surfaces, used as showcase
 * artifacts inside the Odylic pitch page. They're styled to look
 * like real screenshots — same colors, typography, components — so
 * the pitch reads as "here's the product" not "here's a metaphor".
 */

export function TripWorkspaceMockup() {
  return (
    <div className="mock-frame">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">luxe.app / trip / Tokyo & Kyoto</div>
      </div>
      <div className="mock-body">
        <div className="mock-trip-hero">
          <div className="mock-eyebrow">For Marcela Fuentes →</div>
          <h3 className="mock-trip-h">Tokyo &amp; Kyoto, May 2026</h3>
          <div className="mock-trip-meta">
            May 14–22, 2026 · 2 travelers · Budget <em>$48,000</em> ·{" "}
            <em>62%</em> committed · <span className="mock-margin">28% margin</span>
          </div>
        </div>
        <div className="mock-divider" />
        <div className="mock-sec-lbl">Agent Pipeline</div>
        <div className="mock-agents">
          <div className="mock-agent done">
            <div className="mock-agent-icon">✈</div>
            <div className="mock-agent-name">Flight</div>
            <div className="mock-agent-state">Confirmed · JL011</div>
          </div>
          <div className="mock-agent done">
            <div className="mock-agent-icon">⌂</div>
            <div className="mock-agent-name">Hotel</div>
            <div className="mock-agent-state">Aman Tokyo, 4 nights</div>
          </div>
          <div className="mock-agent running">
            <div className="mock-agent-icon">⊞</div>
            <div className="mock-agent-name">Itinerary</div>
            <div className="mock-agent-state">Crafting day 4–6...</div>
          </div>
          <div className="mock-agent wait">
            <div className="mock-agent-icon">◉</div>
            <div className="mock-agent-name">Dining</div>
            <div className="mock-agent-state">Awaiting itinerary</div>
          </div>
        </div>
        <div className="mock-approve">
          <div className="mock-approve-l">
            <div className="mock-approve-eb">Aprobación requerida</div>
            <div className="mock-approve-h">
              Reservar <em>Sazenka</em>, día 4 · 19:30 · 2 pax
            </div>
            <div className="mock-approve-rat">
              Match con cocina kaiseki que mencionó Marcela en discovery.
              Disponibilidad cierra en 36h.
            </div>
          </div>
          <button className="mock-approve-btn">Approve &amp; book</button>
        </div>
      </div>
    </div>
  );
}

export function CrmIntelligenceMockup() {
  return (
    <div className="mock-frame">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">luxe.app / clients / Marcela Fuentes</div>
      </div>
      <div className="mock-body mock-body-row">
        <div className="mock-crm-l">
          <div className="mock-avatar-circle">M</div>
          <div className="mock-client-h">Marcela Fuentes</div>
          <div className="mock-client-tags">
            <span className="mock-pill mock-pill-vip">VIP</span>
            <span className="mock-pill">Active</span>
          </div>
          <div className="mock-kpi-strip">
            <div className="mock-kpi">
              <div className="mock-kpi-lbl">LTV</div>
              <div className="mock-kpi-val">$284k</div>
            </div>
            <div className="mock-kpi">
              <div className="mock-kpi-lbl">Trips</div>
              <div className="mock-kpi-val">11</div>
            </div>
            <div className="mock-kpi">
              <div className="mock-kpi-lbl">NPS</div>
              <div className="mock-kpi-val">9.4</div>
            </div>
          </div>
        </div>
        <div className="mock-crm-r">
          <div className="mock-rp-lbl">AI Client Intelligence</div>
          <div className="mock-insight insight-signal">
            <div className="mock-insight-tag">Next Trip Signal</div>
            <div className="mock-insight-body">
              <em>87% probabilidad</em> de viaje en Q4. Patrón histórico: cada
              11 meses tras retorno. Sugerido outreach esta semana —
              destinos: Marruecos, Patagonia, Japón.
            </div>
          </div>
          <div className="mock-insight insight-spend">
            <div className="mock-insight-tag">Spend Pattern</div>
            <div className="mock-insight-body">
              Ticket promedio subiendo 18% YoY. Aceptó upgrade en 3 de
              últimos 4 viajes. <em>Techo aún sin testear</em> — espacio
              para suite premier.
            </div>
          </div>
          <div className="mock-insight insight-risk">
            <div className="mock-insight-tag">Risk Flag</div>
            <div className="mock-insight-body">
              <em>0 referidos generados</em> en últimos 18 meses pese a NPS
              alto. Considerar invitación a evento Odylic Q3.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PipelineMockup() {
  const cols = [
    {
      label: "Discovery",
      cards: [
        { name: "Diego Larraín", note: "Marruecos, Oct" },
        { name: "Familia Vial", note: "Safari Tanzania" },
      ],
    },
    {
      label: "Proposing",
      cards: [
        { name: "Lucia Errázuriz", note: "Japón, Nov", highlight: true },
        { name: "Tomás Prieto", note: "Italia + Grecia" },
      ],
    },
    {
      label: "Booked",
      cards: [
        { name: "Marcela Fuentes", note: "Tokyo & Kyoto, May" },
        { name: "Patricio Arias", note: "Maldives, Jun" },
      ],
    },
    {
      label: "Returning",
      cards: [{ name: "Renata Soto", note: "Patagonia, Mar" }],
    },
  ];
  return (
    <div className="mock-frame">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">luxe.app / pipeline</div>
      </div>
      <div className="mock-body">
        <div className="mock-pipeline">
          {cols.map((c) => (
            <div key={c.label} className="mock-pl-col">
              <div className="mock-pl-head">{c.label}</div>
              {c.cards.map((card, i) => (
                <div
                  key={i}
                  className={`mock-pl-card${card.highlight ? " hl" : ""}`}
                >
                  <div className="mock-pl-name">{card.name}</div>
                  <div className="mock-pl-note">{card.note}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocumentVaultMockup() {
  return (
    <div className="mock-frame">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">luxe.app / clients / Marcela / documents</div>
      </div>
      <div className="mock-body">
        <div className="mock-doc">
          <div className="mock-doc-kind">Passport</div>
          <div className="mock-doc-info">
            <div className="mock-doc-name">marcela-passport-cl.pdf</div>
            <div className="mock-doc-summary">
              Pasaporte chileno de Marcela Fuentes, válido hasta 2031-08-14.
            </div>
            <div className="mock-doc-fields">
              <span className="mock-field">
                <span className="mock-field-l">No.</span>
                <span className="mock-field-v">CL 14582901</span>
              </span>
              <span className="mock-field">
                <span className="mock-field-l">Nacionalidad</span>
                <span className="mock-field-v">Chilena</span>
              </span>
              <span className="mock-field">
                <span className="mock-field-l">Nacimiento</span>
                <span className="mock-field-v">12.05.1981</span>
              </span>
              <span className="mock-field">
                <span className="mock-field-l">Expira</span>
                <span className="mock-field-v">14.08.2031</span>
              </span>
              <span className="mock-field mock-field-warn">
                <span className="mock-field-l">Visa Japón</span>
                <span className="mock-field-v">vence 22 Jun</span>
              </span>
            </div>
          </div>
        </div>
        <div className="mock-doc-mini">
          <div className="mock-doc-mini-kind">Voucher</div>
          <div className="mock-doc-mini-info">
            <div className="mock-doc-mini-name">aman-tokyo-confirmation.pdf</div>
            <div className="mock-doc-mini-meta">
              Booking AM-748291 · 4 noches · USD 18,400 · Check-in 14 May
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MidTripCompanionMockup() {
  return (
    <div className="mock-frame">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">share.luxe.app / Marcela Fuentes · Tokyo &amp; Kyoto</div>
      </div>
      <div className="mock-body">
        <div className="mock-mt-hero">
          <div className="mock-eyebrow">For Marcela Fuentes</div>
          <div className="mock-mt-title">Tokyo &amp; Kyoto</div>
          <div className="mock-mt-meta">
            14 May – 22 May · Underway · <em>day 4 of 7</em>
          </div>
        </div>
        <div className="mock-mt-phase">
          <div className="mock-mt-phase-lbl">Right now</div>
          <div className="mock-mt-phase-body">
            Day 4 of 7 · Tokyo &amp; Kyoto, Japan
          </div>
        </div>
        <div className="mock-mt-note">
          <div className="mock-mt-note-icon">✦</div>
          <div className="mock-mt-note-body">
            <div className="mock-mt-note-from">
              A note from <em>Camila</em>
            </div>
            <div className="mock-mt-note-text">
              Light rain after 4pm — I&rsquo;ve moved tonight&rsquo;s rooftop
              dinner indoors. The view is just as lovely.
            </div>
          </div>
        </div>
        <div className="mock-mt-day">
          <div className="mock-mt-day-num">17</div>
          <div className="mock-mt-day-evts">
            <div className="mock-mt-evt">
              <span className="mock-mt-evt-time">09:00</span>
              <span className="mock-mt-evt-name">teamLab Planets — early access</span>
            </div>
            <div className="mock-mt-evt is-surprise">
              <span className="mock-mt-evt-tag">A small touch</span>
              <span className="mock-mt-evt-time">19:30</span>
              <span className="mock-mt-evt-name">
                Sake pairing &amp; tasting · Aman Tokyo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NpsMockup() {
  return (
    <div className="mock-frame mock-frame-tight">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">share.luxe.app / Marcela Fuentes · post-trip</div>
      </div>
      <div className="mock-body">
        <div className="mock-nps">
          <div className="mock-nps-eyebrow">A few words</div>
          <div className="mock-nps-h">How was the trip?</div>
          <div className="mock-nps-thanks">
            Marcela, your honest read shapes everything we do next.
          </div>
          <div className="mock-nps-prompt">
            On a scale of 0 to 10, how likely are you to recommend us to a
            friend?
          </div>
          <div className="mock-nps-scale">
            {Array.from({ length: 11 }, (_, i) => (
              <div key={i} className={`mock-nps-num${i === 9 ? " is-active" : ""}`}>
                {i}
              </div>
            ))}
          </div>
          <div className="mock-nps-axis">
            <span>Not likely</span>
            <span>Extremely likely</span>
          </div>
          <div className="mock-nps-comment">
            &ldquo;Camila pensó en cosas que ni se nos habrían ocurrido. La
            cena de aniversario en el ryokan nos sorprendió completamente.
            Volvemos.&rdquo;
          </div>
          <div className="mock-nps-cta">Send to my designer</div>
        </div>
      </div>
    </div>
  );
}

export function ReportsMockup() {
  return (
    <div className="mock-frame">
      <div className="mock-window">
        <span /><span /><span />
        <div className="mock-url">luxe.app / reports</div>
      </div>
      <div className="mock-body">
        <div className="mock-reports-strip">
          <div className="mock-rp-kpi">
            <div className="mock-rp-kpi-lbl">Trips</div>
            <div className="mock-rp-kpi-val">47</div>
          </div>
          <div className="mock-rp-kpi">
            <div className="mock-rp-kpi-lbl">Sell</div>
            <div className="mock-rp-kpi-val">$2.4M</div>
          </div>
          <div className="mock-rp-kpi">
            <div className="mock-rp-kpi-lbl">Cost</div>
            <div className="mock-rp-kpi-val">$1.7M</div>
          </div>
          <div className="mock-rp-kpi accent">
            <div className="mock-rp-kpi-lbl">Margin</div>
            <div className="mock-rp-kpi-val">$682k</div>
            <div className="mock-rp-kpi-note">28.4%</div>
          </div>
        </div>
        <div className="mock-rp-table">
          <div className="mock-rp-row mock-rp-head">
            <span>Destino</span>
            <span className="num">Trips</span>
            <span className="num">Sell</span>
            <span className="num">Margen</span>
            <span className="num">%</span>
          </div>
          <div className="mock-rp-row">
            <span>Japón</span>
            <span className="num">12</span>
            <span className="num">$684k</span>
            <span className="num">$232k</span>
            <span className="num"><em>34%</em></span>
          </div>
          <div className="mock-rp-row">
            <span>Marruecos</span>
            <span className="num">8</span>
            <span className="num">$412k</span>
            <span className="num">$144k</span>
            <span className="num"><em>35%</em></span>
          </div>
          <div className="mock-rp-row">
            <span>Maldivas</span>
            <span className="num">6</span>
            <span className="num">$528k</span>
            <span className="num">$148k</span>
            <span className="num"><em>28%</em></span>
          </div>
          <div className="mock-rp-row">
            <span>Patagonia</span>
            <span className="num">9</span>
            <span className="num">$386k</span>
            <span className="num">$96k</span>
            <span className="num"><em>25%</em></span>
          </div>
        </div>
      </div>
    </div>
  );
}
