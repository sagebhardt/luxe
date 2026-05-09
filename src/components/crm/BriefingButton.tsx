"use client";

import { useState, useTransition } from "react";
import { prepareBriefingAction } from "@/app/(app)/clients/briefing-actions";
import type { ClientBriefingOutput } from "@/lib/ai/agents/client-briefing";

const URGENCY_CLASS: Record<string, string> = {
  high: "urg-high",
  medium: "urg-medium",
  low: "urg-low",
};

export function BriefingButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [briefing, setBriefing] = useState<ClientBriefingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    setBriefing(null);
    setOpen(true);
    startTransition(async () => {
      const r = await prepareBriefingAction(clientId);
      if (r.ok) setBriefing(r.briefing);
      else setError(r.error);
    });
  };

  return (
    <>
      <button type="button" className="btn btn-outline" onClick={run}>
        Prepare briefing
      </button>
      {open ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="modal-card briefing-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 className="modal-title">Briefing — {clientName}</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => !pending && setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="modal-body briefing-body">
              {pending ? (
                <div className="briefing-loading">
                  <span className="pulse" /> Compiling briefing…
                </div>
              ) : error ? (
                <div className="briefing-error">{error}</div>
              ) : briefing ? (
                <div className="briefing-content">
                  <section>
                    <h3 className="briefing-h">Overview</h3>
                    <p>{briefing.overview}</p>
                  </section>

                  {briefing.activeTripStatus ? (
                    <section>
                      <h3 className="briefing-h">Active trip</h3>
                      <p>{briefing.activeTripStatus}</p>
                    </section>
                  ) : null}

                  {briefing.openItems.length > 0 ? (
                    <section>
                      <h3 className="briefing-h">Open items</h3>
                      <ul className="briefing-list">
                        {briefing.openItems.map((it, i) => (
                          <li key={i}>
                            <span
                              className={`urg-pill ${URGENCY_CLASS[it.urgency] ?? ""}`}
                            >
                              {it.urgency}
                            </span>
                            <div>
                              <div className="briefing-item-title">{it.title}</div>
                              <div className="briefing-item-note">{it.note}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <section>
                    <h3 className="briefing-h">Talking points</h3>
                    <ul className="briefing-list-simple">
                      {briefing.talkingPoints.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </section>

                  {briefing.watchOuts.length > 0 ? (
                    <section>
                      <h3 className="briefing-h">Watch-outs</h3>
                      <ul className="briefing-list-simple watch-outs">
                        {briefing.watchOuts.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => !pending && setOpen(false)}
              >
                Close
              </button>
              {!pending && briefing ? (
                <button
                  type="button"
                  className="btn btn-forest"
                  onClick={run}
                >
                  Regenerate
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
