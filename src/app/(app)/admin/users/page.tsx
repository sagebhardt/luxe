import { listUsersWithStats } from "@/lib/queries/users";
import { UserRow } from "@/components/admin/UserRow";
import { formatAmountShort } from "@/lib/format";
import { getCurrentUserOrThrow } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUserOrThrow();
  const users = await listUsersWithStats();
  const itdCount = users.filter((u) => u.role === "itd").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const totalSell = users.reduce((acc, u) => acc + u.sellTotal, 0);

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Users</h1>
          <p className="reports-sub">
            La red de Odylic — ITDs activos y administradores. Edita el rol o
            el porcentaje de comisión inline. Los nuevos ITDs aparecen
            automáticamente en su primer login.
          </p>
        </div>
        <div className="admin-summary">
          <div className="admin-summary-stat">
            <span className="admin-summary-num">{itdCount}</span>
            <span className="admin-summary-lbl">ITDs</span>
          </div>
          <div className="admin-summary-stat">
            <span className="admin-summary-num">{adminCount}</span>
            <span className="admin-summary-lbl">Admins</span>
          </div>
          <div className="admin-summary-stat">
            <span className="admin-summary-num">
              {formatAmountShort(totalSell, "USD")}
            </span>
            <span className="admin-summary-lbl">Sell volume</span>
          </div>
        </div>
      </div>

      <div className="admin-invite-hint">
        <strong>Invitar a un ITD:</strong> compártele la URL de sign-up.
        Aparecerá aquí automáticamente cuando inicie sesión por primera vez,
        listado como ITD con comisión 50%. Desde aquí puedes ajustar su
        tier o promoverla a admin.
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th className="num">Clientes</th>
            <th className="num">Sell volume</th>
            <th className="num">Comisión ITD</th>
            <th>Desde</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u.id} user={u} isMe={u.id === me.id} />
          ))}
        </tbody>
      </table>
    </main>
  );
}
