import { count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, clients, trips } from "@/lib/db/schema";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { formatAmountShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getCurrentUserOrThrow();
  const itdPct = Number(viewer.commissionPctBase);

  /* Quick portfolio snapshot for the ITD's own settings page. */
  const [clientRow] = await db
    .select({ count: count(clients.id) })
    .from(clients)
    .where(eq(clients.ownerId, viewer.id));

  const [sellRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${bookings.sellAmount})::float, 0)`,
    })
    .from(bookings)
    .innerJoin(trips, eq(trips.id, bookings.tripId))
    .innerJoin(clients, eq(clients.id, trips.clientId))
    .where(eq(clients.ownerId, viewer.id));

  const sellTotal = Number(sellRow?.total ?? 0);
  const clientCount = Number(clientRow?.count ?? 0);

  const since = new Date(viewer.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const currentMonth = new Date().toISOString().slice(0, 7);

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Tu cuenta</h1>
          <p className="reports-sub">
            Tu perfil, tu tier de comisión, y un snapshot rápido de tu
            cartera. Para cambios — promoción, ajuste de tier, transferencia
            de clientes — contacta a un admin de Odylic.
          </p>
        </div>
        <a
          href={`/api/itd/${viewer.id}/statement.pdf?month=${currentMonth}`}
          target="_blank"
          rel="noreferrer"
          className="invite-btn"
        >
          Descargar statement del mes
        </a>
      </div>

      <section className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-lbl">Nombre</div>
          <div className="settings-card-val">
            {viewer.name || <span className="muted">— sin nombre —</span>}
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-lbl">Email</div>
          <div className="settings-card-val">
            {viewer.email || <span className="muted">—</span>}
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-lbl">Rol</div>
          <div className="settings-card-val">
            {viewer.role === "admin" ? "Admin" : "ITD"}
          </div>
        </div>
        <div className="settings-card accent">
          <div className="settings-card-lbl">Tu comisión</div>
          <div className="settings-card-val">
            {Math.round(itdPct * 100)}%
          </div>
          <div className="settings-card-note">
            {Math.round(itdPct * 100)}/{Math.round((1 - itdPct) * 100)} ITD/Odylic
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-lbl">Clientes activos</div>
          <div className="settings-card-val">{clientCount}</div>
        </div>
        <div className="settings-card">
          <div className="settings-card-lbl">Sell volume (USD eq.)</div>
          <div className="settings-card-val">
            {sellTotal > 0 ? formatAmountShort(sellTotal, "USD") : "—"}
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card-lbl">En la red desde</div>
          <div className="settings-card-val">{since}</div>
        </div>
      </section>
    </main>
  );
}
