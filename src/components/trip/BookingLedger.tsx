"use client";

import { useState, useTransition } from "react";
import {
  createLedgerEntryAction,
  setLedgerStatusAction,
  deleteLedgerEntryAction,
} from "@/app/(app)/trip/ledger-actions";
import { formatAmount, SUPPORTED_CURRENCIES } from "@/lib/format";

type Entry = {
  id: string;
  kind: string;
  amount: string;
  currency: string;
  reference: string | null;
  status: "pending" | "completed" | "cancelled";
  occurredOn: string;
  notes: string | null;
};

const KIND_LABEL: Record<string, string> = {
  client_invoice: "Factura cliente",
  client_payment: "Pago cliente",
  supplier_payment: "Pago proveedor",
  commission_received: "Comisión recibida",
};

/** ITD-creatable kinds (itd_payout is admin-only). */
const KINDS = [
  "client_invoice",
  "client_payment",
  "supplier_payment",
  "commission_received",
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "pendiente",
  completed: "completado",
  cancelled: "cancelado",
};

export function BookingLedger({
  bookingId,
  entries,
  defaultCurrency,
}: {
  bookingId: string;
  entries: Entry[];
  defaultCurrency: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    setError(null);
    startTransition(async () => {
      const r = await createLedgerEntryAction({
        bookingId,
        kind: String(fd.get("kind")),
        amount: String(fd.get("amount") ?? ""),
        currency: String(fd.get("currency") ?? defaultCurrency),
        reference: String(fd.get("reference") ?? "") || undefined,
        status: String(fd.get("status") ?? "pending"),
        occurredOn:
          String(fd.get("occurredOn") ?? "") ||
          new Date().toISOString().slice(0, 10),
        notes: String(fd.get("notes") ?? "") || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      form.reset();
      setOpen(false);
    });
  };

  return (
    <div className="bk-ledger">
      <div className="bk-ledger-head">
        <span className="bk-ledger-lbl">Ledger</span>
        <button
          type="button"
          className="link-btn"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "cancelar" : "+ entrada"}
        </button>
      </div>

      {open ? (
        <form className="bk-ledger-form" onSubmit={onSubmit}>
          <div className="bk-ledger-grid">
            <select name="kind" disabled={pending} className="users-select">
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="amount"
              inputMode="decimal"
              placeholder="Monto"
              disabled={pending}
              required
              className="invite-input"
            />
            <select
              name="currency"
              defaultValue={defaultCurrency}
              disabled={pending}
              className="users-select"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="occurredOn"
              defaultValue={new Date().toISOString().slice(0, 10)}
              disabled={pending}
              className="invite-input"
            />
            <input
              type="text"
              name="reference"
              placeholder="Ref (factura, transfer)"
              disabled={pending}
              className="invite-input"
            />
            <select
              name="status"
              defaultValue="pending"
              disabled={pending}
              className="users-select"
            >
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
            </select>
            <input
              type="text"
              name="notes"
              placeholder="Notas (opcional)"
              disabled={pending}
              className="invite-input bk-ledger-wide"
            />
          </div>
          <div className="bk-ledger-form-actions">
            <button
              type="submit"
              className="invite-btn bk-ledger-submit"
              disabled={pending}
            >
              {pending ? "Guardando…" : "Crear"}
            </button>
            {error ? <span className="invite-err">{error}</span> : null}
          </div>
        </form>
      ) : null}

      {entries.length > 0 ? (
        <ul className="bk-ledger-list">
          {entries.map((e) => (
            <BookingLedgerRow key={e.id} entry={e} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function BookingLedgerRow({ entry }: { entry: Entry }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onMarkPaid = () => {
    setError(null);
    startTransition(async () => {
      const r = await setLedgerStatusAction(entry.id, "completed");
      if (!r.ok) setError(r.error);
    });
  };

  const onDelete = () => {
    if (!confirm("Eliminar entrada del ledger?")) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteLedgerEntryAction(entry.id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <li
      className={`bk-ledger-row${pending ? " pending" : ""}${
        entry.status === "cancelled" ? " cancelled" : ""
      }`}
    >
      <span className="bk-ledger-date">
        {new Date(entry.occurredOn).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
      <span className="bk-ledger-kind">
        {KIND_LABEL[entry.kind] ?? entry.kind}
      </span>
      <span className="bk-ledger-amount">
        {formatAmount(entry.amount, entry.currency)}
      </span>
      <span className={`bk-ledger-status status-${entry.status}`}>
        {STATUS_LABEL[entry.status]}
      </span>
      <span className="bk-ledger-ref">{entry.reference || ""}</span>
      <span className="bk-ledger-actions">
        {entry.status === "pending" ? (
          <button
            type="button"
            className="link-btn"
            disabled={pending}
            onClick={onMarkPaid}
            title="Marcar como completado"
          >
            ✓
          </button>
        ) : null}
        <button
          type="button"
          className="link-btn link-btn-danger"
          disabled={pending}
          onClick={onDelete}
        >
          ×
        </button>
      </span>
      {error ? <span className="invite-err">{error}</span> : null}
    </li>
  );
}
