import { desc, eq } from "drizzle-orm";
import { listUsersWithStats } from "@/lib/queries/users";
import { UserRow } from "@/components/admin/UserRow";
import { InviteForm } from "@/components/admin/InviteForm";
import { InvitationRow } from "@/components/admin/InvitationRow";
import { formatAmountShort } from "@/lib/format";
import { getCurrentUserOrThrow } from "@/lib/auth";
import { db } from "@/lib/db";
import { userInvitations } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getCurrentUserOrThrow();
  const [users, pendingInvites] = await Promise.all([
    listUsersWithStats(),
    db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.status, "pending"))
      .orderBy(desc(userInvitations.createdAt)),
  ]);
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

      <InviteForm />

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
          {pendingInvites.map((inv) => (
            <InvitationRow key={inv.id} invitation={inv} />
          ))}
          {users.map((u) => (
            <UserRow key={u.id} user={u} isMe={u.id === me.id} />
          ))}
        </tbody>
      </table>
    </main>
  );
}
