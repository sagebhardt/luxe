"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClientAction } from "@/app/(app)/clients/actions";
import { Modal } from "@/components/shared/Modal";

export function NewClientButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="new-client-btn"
        title="Add a new client"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        + New
      </button>

      <Modal
        open={open}
        ariaLabel="New client"
        onClose={() => !pending && setOpen(false)}
      >
        <form
          action={(fd) => {
            setError(null);
            startTransition(async () => {
              const r = await createClientAction(fd);
              if (r.ok) {
                setOpen(false);
                router.push(`/clients?id=${r.clientId}`);
              } else {
                setError(r.error);
              }
            });
          }}
        >
          <div className="modal-head">
            <h2 className="modal-title">New client</h2>
            <button
              type="button"
              className="modal-close"
              onClick={() => !pending && setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="modal-body">
            <Field label="Name" required>
              <input name="name" required placeholder="e.g. Marcela Fuentes" />
            </Field>
            <div className="modal-row-2">
              <Field label="Email">
                <input
                  name="email"
                  type="email"
                  placeholder="marcela@example.com"
                />
              </Field>
              <Field label="Phone">
                <input name="phone" placeholder="+56 9 8812 4401" />
              </Field>
            </div>
            <Field label="Tag">
              <select name="tag" defaultValue="prospect">
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="dormant">Dormant</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea
                name="notes"
                rows={3}
                placeholder="e.g. Santiago, Chile · Referred by Lorenzo"
              />
            </Field>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => !pending && setOpen(false)}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-forest"
              disabled={pending}
            >
              {pending ? "Creating…" : "Create"}
            </button>
            {error ? <span className="modal-err">{error}</span> : null}
          </div>
        </form>
      </Modal>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="modal-field">
      <span>
        {label}
        {required ? <em> *</em> : null}
      </span>
      {children}
    </label>
  );
}
