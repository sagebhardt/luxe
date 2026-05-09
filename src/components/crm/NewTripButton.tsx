"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTripAction } from "@/app/(app)/clients/actions";

export function NewTripButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        className="btn btn-forest"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        New Trip
      </button>

      {open ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !pending && setOpen(false)}
        >
          <form
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            action={(fd) => {
              setError(null);
              fd.set("clientId", clientId);
              startTransition(async () => {
                const r = await createTripAction(fd);
                if (r.ok) {
                  setOpen(false);
                  router.push(`/trip?id=${r.tripId}`);
                } else {
                  setError(r.error);
                }
              });
            }}
          >
            <div className="modal-head">
              <h2 className="modal-title">New trip</h2>
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
              <Field label="Trip name" required>
                <input
                  name="name"
                  required
                  placeholder="e.g. Bali Anniversary"
                />
              </Field>
              <Field label="Destination" required>
                <input
                  name="destination"
                  required
                  placeholder="e.g. Bali, Indonesia"
                />
              </Field>
              <div className="modal-row-2">
                <Field label="Start date">
                  <input type="date" name="startDate" />
                </Field>
                <Field label="End date">
                  <input type="date" name="endDate" />
                </Field>
              </div>
              <div className="modal-row-2">
                <Field label="Travelers">
                  <input
                    type="number"
                    name="travelerCount"
                    min={1}
                    defaultValue={2}
                  />
                </Field>
                <Field label="Budget (USD)">
                  <input
                    type="number"
                    name="budgetUsd"
                    min={0}
                    step={100}
                    placeholder="12400"
                  />
                </Field>
              </div>
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
                {pending ? "Creating…" : "Create &amp; Open"}
              </button>
              {error ? <span className="modal-err">{error}</span> : null}
            </div>
          </form>
        </div>
      ) : null}
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
