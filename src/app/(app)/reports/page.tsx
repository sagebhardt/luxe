import { getReportSummary } from "@/lib/queries/reports";
import { ReportingCurrencyForm } from "@/components/reports/ReportingCurrencyForm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { formatAmountShort } from "@/lib/format";
import { getCurrentUserOrThrow } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const viewer = await getCurrentUserOrThrow();
  const summary = await getReportSummary(viewer);
  const [settings] = await db
    .select({ ccy: appSettings.reportingCurrency })
    .from(appSettings)
    .limit(1);
  const reportingCurrency = settings?.ccy ?? "USD";
  const isAdmin = viewer.role === "admin";

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Reports</h1>
          <p className="reports-sub">
            {isAdmin ? (
              <>
                Vista de Odylic — margen y comisiones de toda la red de ITDs,
                en la moneda de reporte.
              </>
            ) : (
              <>
                Tu cartera. Margen total de tus reservas y la comisión que te
                corresponde según tu tier.
              </>
            )}
          </p>
        </div>
        <ReportingCurrencyForm current={reportingCurrency} />
      </div>

      {summary.totals.tripCount === 0 ? (
        <div className="reports-empty">
          <p>
            No bookings have cost or sell prices yet. Open a trip and edit the
            margin on a Committed Decision card to start populating this view.
          </p>
        </div>
      ) : (
        <>
          <section className="reports-kpi-strip">
            <Kpi
              label="Trips"
              value={String(summary.totals.tripCount)}
              note={
                summary.totals.unlockedLines > 0
                  ? `${summary.totals.unlockedLines} estimated`
                  : null
              }
            />
            <Kpi
              label="Sell"
              value={formatAmountShort(
                summary.totals.sell,
                reportingCurrency,
              )}
            />
            <Kpi
              label="Margin"
              value={formatAmountShort(
                summary.totals.margin,
                reportingCurrency,
              )}
              note={
                summary.totals.marginPct != null
                  ? `${summary.totals.marginPct.toFixed(1)}%`
                  : null
              }
            />
            {isAdmin ? (
              <Kpi
                label="Odylic share"
                value={formatAmountShort(
                  summary.totals.odylicShare,
                  reportingCurrency,
                )}
                note="50/50 default · per-ITD tier"
                accent
              />
            ) : (
              <Kpi
                label="Tu comisión"
                value={formatAmountShort(
                  summary.totals.itdShare,
                  reportingCurrency,
                )}
                note="según tu tier"
                accent
              />
            )}
          </section>

          {isAdmin && summary.byItd ? (
            <section className="reports-section">
              <h2 className="reports-h2">Por ITD</h2>
              <ReportTable
                rows={summary.byItd}
                reportingCurrency={reportingCurrency}
                showSplit
              />
            </section>
          ) : null}

          <section className="reports-section">
            <h2 className="reports-h2">By destination</h2>
            <ReportTable
              rows={summary.byDestination}
              reportingCurrency={reportingCurrency}
              showSplit={isAdmin}
            />
          </section>

          <section className="reports-section">
            <h2 className="reports-h2">By month</h2>
            <ReportTable
              rows={summary.byMonth}
              reportingCurrency={reportingCurrency}
              showSplit={isAdmin}
            />
          </section>
        </>
      )}
    </main>
  );
}

function Kpi({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string | null;
  accent?: boolean;
}) {
  return (
    <div className={`reports-kpi${accent ? " accent" : ""}`}>
      <div className="reports-kpi-label">{label}</div>
      <div className="reports-kpi-value">{value}</div>
      {note ? <div className="reports-kpi-note">{note}</div> : null}
    </div>
  );
}

function ReportTable({
  rows,
  reportingCurrency,
  showSplit,
}: {
  rows: Array<{
    key: string;
    label: string;
    sell: number;
    cost: number;
    margin: number;
    marginPct: number | null;
    itdShare: number;
    odylicShare: number;
    tripCount: number;
    unlockedLines: number;
  }>;
  reportingCurrency: string;
  showSplit?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="reports-empty-line">No data.</p>;
  }
  return (
    <table className="reports-table">
      <thead>
        <tr>
          <th></th>
          <th className="num">Trips</th>
          <th className="num">Sell</th>
          <th className="num">Margin</th>
          {showSplit ? (
            <>
              <th className="num">ITD</th>
              <th className="num">Odylic</th>
            </>
          ) : null}
          <th className="num">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td className="reports-row-label">{r.label}</td>
            <td className="num">{r.tripCount}</td>
            <td className="num">
              {formatAmountShort(r.sell, reportingCurrency)}
            </td>
            <td className="num">
              {formatAmountShort(r.margin, reportingCurrency)}
            </td>
            {showSplit ? (
              <>
                <td className="num">
                  {formatAmountShort(r.itdShare, reportingCurrency)}
                </td>
                <td className="num">
                  {formatAmountShort(r.odylicShare, reportingCurrency)}
                </td>
              </>
            ) : null}
            <td className="num">
              {r.marginPct != null ? (
                <em
                  className={
                    r.unlockedLines > 0 ? "reports-pct est" : "reports-pct"
                  }
                >
                  {r.marginPct.toFixed(0)}%
                </em>
              ) : (
                "—"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
