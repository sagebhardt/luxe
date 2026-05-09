import {
  type AmountByCurrency,
  getLedgerSummary,
  listItdLedgerStats,
  listRecentLedgerEntries,
} from "@/lib/queries/ledger";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/db/schema";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { formatAmount } from "@/lib/format";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  client_invoice: "Factura cliente",
  client_payment: "Pago cliente",
  supplier_payment: "Pago proveedor",
  commission_received: "Comisión recibida",
  itd_payout: "Pago a ITD",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
};

export default async function AdminLedgerPage() {
  const viewer = await getCurrentUserOrThrow();
  const [settingsRow] = await db
    .select({ ccy: appSettings.reportingCurrency })
    .from(appSettings)
    .limit(1);
  const reportingCurrency = settingsRow?.ccy ?? "USD";

  const [summary, perItd, recent] = await Promise.all([
    getLedgerSummary({ reportingCurrency }),
    listItdLedgerStats(),
    listRecentLedgerEntries(viewer, 50),
  ]);

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Ledger</h1>
          <p className="reports-sub">
            Movimiento real de dinero, desglosado por moneda. Los totales
            principales están convertidos a {reportingCurrency} al tipo de
            cambio actual; los desgloses por moneda son los valores
            originales (sin pérdida por FX). Cambia la moneda de reporte
            en /reports.
          </p>
        </div>
      </div>

      <section className="reports-kpi-strip">
        <Kpi
          label="Por cobrar (clientes)"
          totalLabel={formatAmount(
            summary.totalsInReporting.clientOutstanding,
            reportingCurrency,
          )}
          breakdown={summary.clientOutstanding}
        />
        <Kpi
          label="Por pagar (proveedores)"
          totalLabel={formatAmount(
            summary.totalsInReporting.supplierOutstanding,
            reportingCurrency,
          )}
          breakdown={summary.supplierOutstanding}
        />
        <Kpi
          label="Comisiones recibidas"
          totalLabel={formatAmount(
            summary.totalsInReporting.commissionsReceived,
            reportingCurrency,
          )}
          breakdown={summary.commissionsReceived}
          accent
        />
        <Kpi
          label="Por pagar a ITDs"
          totalLabel={formatAmount(
            summary.totalsInReporting.itdPending,
            reportingCurrency,
          )}
          subNote={`${formatAmount(
            summary.totalsInReporting.itdPaidOut,
            reportingCurrency,
          )} ya pagado`}
          breakdown={summary.itdPending}
          accent
        />
      </section>

      {perItd.length > 0 ? (
        <section className="reports-section">
          <h2 className="reports-h2">Saldos por ITD</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>ITD</th>
                <th className="num">Pendiente</th>
                <th className="num">Pagado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {perItd.map((p) => (
                <tr key={p.itdUserId}>
                  <td className="users-name">{p.name || p.email || "—"}</td>
                  <td className="num">
                    <CurrencyStack data={p.pending} accent />
                  </td>
                  <td className="num">
                    <CurrencyStack data={p.paid} />
                  </td>
                  <td>
                    <a
                      href={`/api/itd/${p.itdUserId}/statement.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="link-btn"
                    >
                      statement
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="reports-section">
        <h2 className="reports-h2">Entradas recientes</h2>
        {recent.length === 0 ? (
          <div className="reports-empty">
            <p>
              Aún no hay entradas en el ledger. Crea la primera desde el
              trip workspace, en la sección de cada booking.
            </p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Trip / cliente</th>
                <th>ITD</th>
                <th className="num">Monto</th>
                <th>Ref</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td className="users-since">
                    {new Date(r.occurredOn).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td>{KIND_LABEL[r.kind] ?? r.kind}</td>
                  <td className="users-name">
                    {r.tripName || "—"}
                    {r.clientName ? (
                      <span className="muted"> · {r.clientName}</span>
                    ) : null}
                  </td>
                  <td className="users-email">{r.itdName || "—"}</td>
                  <td className="num">
                    {formatAmount(r.amount, r.currency)}
                  </td>
                  <td className="users-email">{r.reference || "—"}</td>
                  <td>{STATUS_LABEL[r.status] ?? r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Kpi({
  label,
  totalLabel,
  subNote,
  breakdown,
  accent,
}: {
  label: string;
  totalLabel: string;
  subNote?: string;
  breakdown: AmountByCurrency;
  accent?: boolean;
}) {
  const ccyKeys = Object.keys(breakdown).sort();
  return (
    <div className={`reports-kpi${accent ? " accent" : ""}`}>
      <div className="reports-kpi-label">{label}</div>
      <div className="reports-kpi-value">{totalLabel}</div>
      {subNote ? <div className="reports-kpi-note">{subNote}</div> : null}
      {ccyKeys.length > 0 ? (
        <div className="kpi-breakdown">
          {ccyKeys.map((c) => (
            <div key={c} className="kpi-breakdown-row">
              <span className="kpi-bd-ccy">{c}</span>
              <span className="kpi-bd-amt">
                {formatAmount(breakdown[c], c)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CurrencyStack({
  data,
  accent,
}: {
  data: AmountByCurrency;
  accent?: boolean;
}) {
  const keys = Object.keys(data).sort();
  if (keys.length === 0) return <span className="muted">—</span>;
  return (
    <span className="ccy-stack">
      {keys.map((c) => (
        <span key={c} className={accent ? "reports-pct" : undefined}>
          {formatAmount(data[c], c)}
        </span>
      ))}
    </span>
  );
}
