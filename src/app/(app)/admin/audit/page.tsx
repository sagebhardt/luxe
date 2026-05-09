import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  user_role_change: "Cambio de rol",
  user_commission_change: "Cambio de comisión",
  client_owner_reassign: "Reasignación de cliente",
  user_invited: "Invitación enviada",
  user_invitation_revoked: "Invitación revocada",
};

export default async function AuditPage() {
  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      before: auditLog.before,
      after: auditLog.after,
      note: auditLog.note,
      createdAt: auditLog.createdAt,
      actorName: users.name,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorUserId))
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Audit log</h1>
          <p className="reports-sub">
            Últimas 200 acciones administrativas: cambios de rol, ajustes de
            comisión, reasignaciones de clientes, invitaciones. Solo lectura.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="reports-empty">
          <p>Aún no hay acciones registradas.</p>
        </div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Cuándo</th>
              <th>Quién</th>
              <th>Acción</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="users-since">
                  {new Date(r.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="users-name">
                  {r.actorName || r.actorEmail || "—"}
                </td>
                <td>{ACTION_LABEL[r.action] ?? r.action}</td>
                <td className="users-email">
                  {r.note ?? `${r.targetType}:${r.targetId ?? "—"}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
