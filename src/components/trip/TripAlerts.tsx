"use client";

import { useState, useTransition } from "react";
import type { tripAlerts } from "@/lib/db/schema";
import {
  createTripAlertAction,
  deleteTripAlertAction,
  toggleAlertClientVisibleAction,
} from "@/app/(app)/trip/alert-actions";

type Alert = typeof tripAlerts.$inferSelect;

export function TripAlerts({
  alerts,
  tripId,
  defaultSignedBy,
}: {
  alerts: Alert[];
  tripId: string;
  defaultSignedBy: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [showAdd, setShowAdd] = useState(false);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"info" | "warn">("info");
  const [publish, setPublish] = useState(true);
  const [signedBy, setSignedBy] = useState(defaultSignedBy ?? "");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!body.trim()) {
      setError("Add a note before saving.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createTripAlertAction({
        tripId,
        body: body.trim(),
        kind,
        clientVisible: publish,
        signedBy: signedBy.trim() || null,
      });
      if (res.ok) {
        setBody("");
        setShowAdd(false);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div>
      {alerts.map((a) => (
        <AlertRow key={a.id} alert={a} tripId={tripId} />
      ))}

      {showAdd ? (
        <div className="alert-add">
          <textarea
            className="alert-add-body"
            placeholder="Note for this trip — e.g. 'Light rain after 4pm; I've moved the rooftop dinner indoors.'"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
          />
          <div className="alert-add-row">
            <label className="alert-add-label">
              Tone
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as "info" | "warn")}
              >
                <option value="info">Info</option>
                <option value="warn">Heads-up</option>
              </select>
            </label>
            <label className="alert-add-label">
              Signed by
              <input
                type="text"
                value={signedBy}
                onChange={(e) => setSignedBy(e.target.value)}
                placeholder="Camila"
              />
            </label>
          </div>
          <label className="alert-add-checkbox">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
            />
            Publish on client share page
          </label>
          {error ? <div className="alert-add-err">{error}</div> : null}
          <div className="alert-add-actions">
            <button
              type="button"
              className="alert-add-cancel"
              onClick={() => {
                setShowAdd(false);
                setError(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="alert-add-save"
              onClick={submit}
              disabled={pending}
            >
              {pending ? "Saving…" : "Add note"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="alert-add-toggle"
          onClick={() => setShowAdd(true)}
        >
          + Add note
        </button>
      )}
    </div>
  );
}

function AlertRow({ alert, tripId }: { alert: Alert; tripId: string }) {
  const [pending, startTransition] = useTransition();
  const [visible, setVisible] = useState(alert.clientVisible);

  const togglePublish = () => {
    const next = !visible;
    setVisible(next);
    startTransition(async () => {
      const res = await toggleAlertClientVisibleAction({
        alertId: alert.id,
        tripId,
        clientVisible: next,
      });
      if (!res.ok) setVisible(!next);
    });
  };

  const remove = () => {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      await deleteTripAlertAction({ alertId: alert.id, tripId });
    });
  };

  return (
    <div
      className={`alert-strip ${alert.kind === "warn" ? "al-warn" : "al-info"}`}
    >
      <div className="alert-strip-icon">{alert.icon ?? "✦"}</div>
      <div className="alert-strip-body">
        <div>{alert.body}</div>
        {alert.signedBy ? (
          <div className="alert-strip-sign">— {alert.signedBy}</div>
        ) : null}
      </div>
      <div className="alert-strip-controls">
        <label className="alert-pub-toggle" title="Visible on client share page">
          <input
            type="checkbox"
            checked={visible}
            onChange={togglePublish}
            disabled={pending}
          />
          <span>{visible ? "Live" : "Internal"}</span>
        </label>
        <button
          type="button"
          className="alert-strip-del"
          onClick={remove}
          disabled={pending}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}
