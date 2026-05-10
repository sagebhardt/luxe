/**
 * Projection chart: 36-month annual-margin estimate with three bands
 * (status quo, conservative Luxe, base Luxe). Bottom-up model — the
 * inputs live in MODEL below and are mirrored in the on-page
 * assumption table so a reader can audit every number.
 *
 * Math at each tick t (months from today):
 *   annualMargin(t) = ITDs(t) × tripsPerITDPerYear(t) × marginPerTrip(t)
 *
 * Each lever ramps linearly between t=0 and t=36 with parameters
 * defined per scenario. The chart is intentionally simple — straight
 * line segments between sampled points, no smoothing — so the reader
 * sees exactly what the model says.
 */

type Scenario = {
  key: string;
  label: string;
  color: string;
  weight: number;
  itd: [number, number]; // ITDs at t=0, t=36
  tripsPerYear: [number, number]; // trips per ITD per year at t=0, t=36
  marginPerTrip: [number, number]; // USD avg margin per trip at t=0, t=36
};

const MODEL: Scenario[] = [
  {
    key: "baseline",
    label: "Sin Luxe",
    color: "var(--stone)",
    weight: 1.5,
    itd: [5, 7],
    tripsPerYear: [18, 18],
    marginPerTrip: [9800, 9800],
  },
  {
    key: "conservative",
    label: "Con Luxe — conservador",
    color: "var(--bark)",
    weight: 2,
    itd: [5, 9],
    tripsPerYear: [18, 25],
    marginPerTrip: [9800, 9800],
  },
  {
    key: "base",
    label: "Con Luxe — base",
    color: "var(--forest)",
    weight: 2.5,
    itd: [5, 12],
    tripsPerYear: [18, 32],
    marginPerTrip: [9800, 10500],
  },
];

const TICKS = [0, 6, 12, 18, 24, 30, 36] as const;
const Y_MAX = 4_500_000;
const Y_LINES = [1_000_000, 2_000_000, 3_000_000, 4_000_000];

const W = 760;
const H = 380;
const PAD = { top: 24, right: 80, bottom: 50, left: 70 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function annualMargin(s: Scenario, monthsFromNow: number): number {
  const t = monthsFromNow / 36;
  const itd = lerp(s.itd[0], s.itd[1], t);
  const trips = lerp(s.tripsPerYear[0], s.tripsPerYear[1], t);
  const margin = lerp(s.marginPerTrip[0], s.marginPerTrip[1], t);
  return itd * trips * margin;
}

function xFor(months: number): number {
  return PAD.left + (months / 36) * PLOT_W;
}

function yFor(value: number): number {
  return PAD.top + PLOT_H - (value / Y_MAX) * PLOT_H;
}

function fmtUsd(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}k`;
  return `$${v}`;
}

export function ProjectionChart() {
  return (
    <figure className="proj-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Estimación de margen anual sobre 36 meses, tres escenarios"
      >
        {/* Y gridlines + labels */}
        {Y_LINES.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yFor(v)}
              y2={yFor(v)}
              stroke="var(--border-lt)"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 12}
              y={yFor(v) + 4}
              textAnchor="end"
              className="proj-axis-lbl"
            >
              {fmtUsd(v)}
            </text>
          </g>
        ))}

        {/* X axis baseline */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={yFor(0)}
          y2={yFor(0)}
          stroke="var(--border)"
          strokeWidth="1"
        />

        {/* X tick labels */}
        {[0, 12, 24, 36].map((m) => (
          <g key={m}>
            <line
              x1={xFor(m)}
              x2={xFor(m)}
              y1={yFor(0)}
              y2={yFor(0) + 5}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={xFor(m)}
              y={yFor(0) + 22}
              textAnchor="middle"
              className="proj-axis-lbl"
            >
              {m === 0 ? "Hoy" : `Mes ${m}`}
            </text>
          </g>
        ))}

        {/* Lines per scenario */}
        {MODEL.map((s) => {
          const points = TICKS.map((m) => ({
            x: xFor(m),
            y: yFor(annualMargin(s, m)),
          }));
          const path = points
            .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
            .join(" ");
          const last = points[points.length - 1];
          const lastValue = annualMargin(s, 36);
          return (
            <g key={s.key}>
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={s.weight}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={s.weight + 0.5}
                  fill="var(--warm-white)"
                  stroke={s.color}
                  strokeWidth="1.5"
                />
              ))}
              <text
                x={last.x + 10}
                y={last.y + 4}
                className="proj-end-lbl"
                style={{ fill: s.color }}
              >
                {fmtUsd(lastValue)}
              </text>
            </g>
          );
        })}
      </svg>

      <figcaption className="proj-legend">
        {MODEL.map((s) => (
          <span key={s.key} className="proj-legend-row">
            <span
              className="proj-legend-swatch"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
