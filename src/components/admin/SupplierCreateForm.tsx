"use client";

import { useState, useTransition } from "react";
import { createSupplierAction } from "@/app/(app)/admin/suppliers/actions";

const KINDS = [
  { value: "hotel", label: "Hotel" },
  { value: "dmc", label: "DMC" },
  { value: "restaurant", label: "Restaurant" },
  { value: "transfer", label: "Transfer" },
  { value: "experience", label: "Experience" },
  { value: "operator", label: "Operator" },
  { value: "airline", label: "Airline" },
  { value: "other", label: "Otro" },
] as const;

const TIERS = [
  { value: "", label: "—" },
  { value: "luxury", label: "Luxury" },
  { value: "premium", label: "Premium" },
  { value: "boutique", label: "Boutique" },
  { value: "standard", label: "Standard" },
] as const;

export function SupplierCreateForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <div className="invite-form supplier-toggle">
        <button
          type="button"
          className="invite-btn"
          onClick={() => setOpen(true)}
        >
          + Nuevo supplier
        </button>
      </div>
    );
  }

  return (
    <form
      className="invite-form supplier-form"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const form = e.currentTarget;
        startTransition(async () => {
          const r = await createSupplierAction(fd);
          if (!r.ok) {
            setError(r.error);
            return;
          }
          form.reset();
          setOpen(false);
        });
      }}
    >
      <div className="supplier-form-grid">
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Nombre*</span>
          <input
            name="name"
            required
            placeholder="Aman Tokyo"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Tipo*</span>
          <select name="kind" disabled={pending} className="users-select">
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Ciudad</span>
          <input
            name="city"
            placeholder="Tokyo"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">País</span>
          <input
            name="country"
            placeholder="Japan"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Región</span>
          <input
            name="region"
            placeholder="Asia Pacific"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Tier</span>
          <select
            name="priceTier"
            defaultValue=""
            disabled={pending}
            className="users-select"
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="bk-fin-field supplier-form-wide">
          <span className="bk-fin-flbl">
            Amenities (separados por coma)
          </span>
          <input
            name="amenities"
            placeholder="pool, spa, kaiseki, family-friendly"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field supplier-form-wide">
          <span className="bk-fin-flbl">Notas (relación, acceso)</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Owner is a personal contact. Garden suite has best view in property."
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field">
          <span className="bk-fin-flbl">Comisión (0..1)</span>
          <input
            name="commissionPct"
            type="number"
            step="0.01"
            min="0"
            max="1"
            placeholder="0.10"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field supplier-flag-field">
          <input type="checkbox" name="preferred" disabled={pending} />
          <span>Preferido</span>
        </label>
        <label className="bk-fin-field supplier-flag-field">
          <input type="checkbox" name="virtuoso" disabled={pending} />
          <span>Virtuoso</span>
        </label>
        <label className="bk-fin-field supplier-form-wide">
          <span className="bk-fin-flbl">Contacto</span>
          <input
            name="contact"
            placeholder="reservations@aman.com · +81 3 1234 5678"
            disabled={pending}
            className="invite-input"
          />
        </label>
        <label className="bk-fin-field supplier-form-wide">
          <span className="bk-fin-flbl">Website</span>
          <input
            name="website"
            type="url"
            placeholder="https://www.aman.com/tokyo"
            disabled={pending}
            className="invite-input"
          />
        </label>
      </div>
      <div className="supplier-form-actions">
        <button type="submit" className="invite-btn" disabled={pending}>
          {pending ? "Creando…" : "Crear supplier"}
        </button>
        <button
          type="button"
          className="link-btn link-btn-muted"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          cancelar
        </button>
      </div>
      {error ? <div className="invite-msg invite-err">{error}</div> : null}
    </form>
  );
}
