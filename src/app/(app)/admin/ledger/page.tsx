import {
  getLedgerSummary,
  listItdLedgerStats,
  listRecentLedgerEntries,
} from "@/lib/queries/ledger";
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
  const [summary, perItd, recent] = await Promise.all([
    getLedgerSummary(),
    listItdLedgerStats(),
    listRecentLedgerEntries(viewer, 50),
  ]);

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Ledger</h1>
          <p className="reports-sub">
            Movimiento real de dinero — facturas a clientes, pagos a
            proveedores, comisiones recibidas, payouts a ITDs. Los rollups
            son sumas por tipo y estado, sin convertir entre monedas
            (próxima iteración). Crea entradas desde cada booking en el
            workspace.
          </p>
        </div>
      </div>

      <section className="reports-kpi-strip">
        <Kpi
          label="Por cobrar (clientes)"
          value={formatAmount(summary.clientOutstanding, "USD")}
          note="invoices issued − payments received"
        />
        <Kpi
          label="Por pagar (proveedores)"
          value={formatAmount(summary.supplierOutstanding, "USD")}
          note="committed − paid"
        />
        <Kpi
          label="Comisiones recibidas"
          value={formatAmount(summary.commissionsReceived, "USD")}
          accent
        />
        <Kpi
          label="Por pagar a ITDs"
          value={formatAmount(summary.itdPending, "USD")}
          note={`${formatAmount(summary.itdPaidOut, "USD")} ya pagado`}
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
              </tr>
            </thead>
            <tbody>
              {perItd.map((p) => (
                <tr key={p.itdUserId ?? p.email ?? p.name ?? "x"}>
                  <td className="users-name">{p.name || p.email || "—"}</td>
                  <td className="num">
                    {p.pending > 0 ? (
                      <em className="reports-pct">
                        {formatAmount(p.pending, "USD")}
                      </em>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="num">{formatAmount(p.paid, "USD")}</td>
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
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
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
