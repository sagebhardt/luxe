"use client";

import { useState, useTransition } from "react";
import {
  deleteSupplierAction,
  toggleSupplierFlagAction,
} from "@/app/(app)/admin/suppliers/actions";
import type { SupplierRow as SupplierRowType } from "@/lib/queries/suppliers";

export function SupplierRow({
  supplier,
  kindLabel,
}: {
  supplier: SupplierRowType;
  kindLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = (flag: "preferred" | "virtuoso") => {
    setError(null);
    startTransition(async () => {
      const r = await toggleSupplierFlagAction(
        supplier.id,
        flag,
        !supplier[flag],
      );
      if (!r.ok) setError(r.error);
    });
  };

  const remove = () => {
    if (!confirm(`Eliminar "${supplier.name}"?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteSupplierAction(supplier.id);
      if (!r.ok) setError(r.error);
    });
  };

  const location = [supplier.city, supplier.country].filter(Boolean).join(", ");
  const commission = supplier.commissionPct
    ? `${(Number(supplier.commissionPct) * 100).toFixed(0)}%`
    : "—";

  return (
    <tr className={pending ? "users-row-pending" : ""}>
      <td className="users-name">
        {supplier.name}
        {supplier.notes ? (
          <span className="supplier-notes-tip" title={supplier.notes}>
            ✎
          </span>
        ) : null}
      </td>
      <td>{kindLabel}</td>
      <td className="users-email">{location || "—"}</td>
      <td className="users-email">
        {supplier.amenities.length > 0 ? (
          <div className="supplier-amenities">
            {supplier.amenities.slice(0, 4).map((a) => (
              <span key={a} className="supplier-amenity">
                {a}
              </span>
            ))}
            {supplier.amenities.length > 4 ? (
              <span className="supplier-amenity-more">
                +{supplier.amenities.length - 4}
              </span>
            ) : null}
          </div>
        ) : (
          "—"
        )}
      </td>
      <td>
        <div className="supplier-flags">
          <button
            type="button"
            className={`supplier-flag${supplier.preferred ? " on" : ""}`}
            disabled={pending}
            onClick={() => toggle("preferred")}
            title="Preferido"
          >
            ★
          </button>
          <button
            type="button"
            className={`supplier-flag virtuoso${supplier.virtuoso ? " on" : ""}`}
            disabled={pending}
            onClick={() => toggle("virtuoso")}
            title="Virtuoso"
          >
            V
          </button>
        </div>
        {error ? <div className="users-error-inline">{error}</div> : null}
      </td>
      <td className="num">{commission}</td>
      <td>
        <button
          type="button"
          className="link-btn link-btn-danger"
          disabled={pending}
          onClick={remove}
        >
          eliminar
        </button>
      </td>
    </tr>
  );
}
