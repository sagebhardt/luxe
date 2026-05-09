import { asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, users } from "@/lib/db/schema";
import { ClientOwnerRow } from "@/components/admin/ClientOwnerRow";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const [clientRows, userRows] = await Promise.all([
    db
      .select()
      .from(clients)
      .orderBy(desc(clients.lifetimeValueCents), asc(clients.name)),
    db.select().from(users).orderBy(asc(users.name)),
  ]);

  const unassignedCount = clientRows.filter((c) => !c.ownerId).length;

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Clients</h1>
          <p className="reports-sub">
            Cada cliente tiene un dueño (un ITD). Reasigna desde aquí cuando
            un ITD deja la red, divides una cartera, o transfieres una
            relación. Los clientes sin dueño solo son visibles para
            admins.
          </p>
        </div>
        <div className="admin-summary">
          <div className="admin-summary-stat">
            <span className="admin-summary-num">{clientRows.length}</span>
            <span className="admin-summary-lbl">Clientes</span>
          </div>
          <div className="admin-summary-stat">
            <span
              className={`admin-summary-num${unassignedCount > 0 ? " warn" : ""}`}
            >
              {unassignedCount}
            </span>
            <span className="admin-summary-lbl">Sin dueño</span>
          </div>
        </div>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Tag</th>
            <th>Etapa</th>
            <th className="num">LTV</th>
            <th>Dueño</th>
          </tr>
        </thead>
        <tbody>
          {clientRows.map((c) => (
            <ClientOwnerRow
              key={c.id}
              client={c}
              users={userRows.map((u) => ({
                id: u.id,
                label: u.name || u.email || u.clerkUserId,
                role: u.role,
              }))}
              ltvLabel={formatMoney(c.lifetimeValueCents)}
            />
          ))}
        </tbody>
      </table>
    </main>
  );
}
