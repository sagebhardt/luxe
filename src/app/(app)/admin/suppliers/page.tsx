import { listSuppliers } from "@/lib/queries/suppliers";
import { SupplierCreateForm } from "@/components/admin/SupplierCreateForm";
import { SupplierRow } from "@/components/admin/SupplierRow";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  hotel: "Hotel",
  dmc: "DMC",
  restaurant: "Restaurant",
  transfer: "Transfer",
  experience: "Experience",
  operator: "Operator",
  airline: "Airline",
  other: "Otro",
};

export default async function AdminSuppliersPage() {
  const suppliers = await listSuppliers();
  const preferredCount = suppliers.filter((s) => s.preferred).length;
  const virtuosoCount = suppliers.filter((s) => s.virtuoso).length;

  return (
    <main className="reports-main">
      <div className="reports-header">
        <div>
          <h1 className="reports-heading">Supplier directory</h1>
          <p className="reports-sub">
            Hoteles, DMCs, restaurantes y operadores curados por Odylic. Los
            ITDs los ven en sus propuestas y los agentes priorizan los
            preferidos al sugerir opciones. Marca <em>preferred</em> para que
            aparezcan primero, <em>virtuoso</em> para señalizar amenities
            especiales.
          </p>
        </div>
        <div className="admin-summary">
          <div className="admin-summary-stat">
            <span className="admin-summary-num">{suppliers.length}</span>
            <span className="admin-summary-lbl">Suppliers</span>
          </div>
          <div className="admin-summary-stat">
            <span className="admin-summary-num">{preferredCount}</span>
            <span className="admin-summary-lbl">Preferidos</span>
          </div>
          <div className="admin-summary-stat">
            <span className="admin-summary-num">{virtuosoCount}</span>
            <span className="admin-summary-lbl">Virtuoso</span>
          </div>
        </div>
      </div>

      <SupplierCreateForm />

      {suppliers.length === 0 ? (
        <div className="reports-empty">
          <p>
            Aún no hay suppliers. Agrega el primero arriba — empieza con tus
            hoteles preferidos en cada destino que diseñas.
          </p>
        </div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th>Amenities</th>
              <th>Flags</th>
              <th className="num">Comisión</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <SupplierRow
                key={s.id}
                supplier={s}
                kindLabel={KIND_LABEL[s.kind] ?? s.kind}
              />
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
