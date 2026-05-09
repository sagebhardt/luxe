import { formatMoney, formatMoneyShort } from "@/lib/format";

export function KpiStrip({
  kpis,
}: {
  kpis: {
    lifetimeValueCents: number;
    tripsCount: number;
    avgTripValueCents: number;
    avgPerYear: string;
    npsScore: number | null;
  };
}) {
  return (
    <div className="kpi-strip">
      <div className="kpi-card">
        <div className="kpi-label">Lifetime Value</div>
        <div className="kpi-val">{formatMoneyShort(kpis.lifetimeValueCents)}</div>
        <div className="kpi-sub up">↑ 22% vs last year</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Trips</div>
        <div className="kpi-val">{kpis.tripsCount}</div>
        <div className="kpi-sub">avg {kpis.avgPerYear} / year</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">Avg Trip Value</div>
        <div className="kpi-val">{formatMoney(kpis.avgTripValueCents)}</div>
        <div className="kpi-sub up">↑ trending up</div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label">NPS Score</div>
        <div className="kpi-val">{kpis.npsScore ?? "—"}</div>
        <div className="kpi-sub warn">1 open feedback</div>
      </div>
    </div>
  );
}
