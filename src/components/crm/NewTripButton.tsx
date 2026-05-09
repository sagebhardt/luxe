"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTripFromProposalAction,
  proposeTripAction,
} from "@/app/(app)/clients/actions";
import type { TripBuilderOutput } from "@/lib/ai/agents/trip-builder";

const SUGGESTIONS = [
  "Tokyo for 8 nights starting Oct 12, business class, ~$12k",
  "Honeymoon in Bali mid-October, two weeks, no chain hotels",
  "Patagonia Traverse Nov 3–14, two travelers, all-inclusive lodges",
];

export function NewTripButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [proposal, setProposal] = useState<TripBuilderOutput | null>(null);

  const reset = () => {
    setProposal(null);
    setPrompt("");
    setError(null);
  };

  const propose = () => {
    if (!prompt.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await proposeTripAction(clientId, prompt);
      if (r.ok) setProposal(r.proposal);
      else setError(r.error);
    });
  };

  const create = () => {
    if (!proposal) return;
    setError(null);
    startTransition(async () => {
      const r = await createTripFromProposalAction({ clientId, proposal });
      if (r.ok) {
        setOpen(false);
        reset();
        router.push(`/trip?id=${r.tripId}`);
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-forest"
        onClick={() => {
          reset();
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
          <div
            className="modal-card builder-card"
            onClick={(e) => e.stopPropagation()}
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

            <div className="modal-body builder-body">
              {!proposal ? (
                <>
                  <label className="builder-label">
                    Describe the trip in your own words
                  </label>
                  <textarea
                    autoFocus
                    rows={4}
                    className="builder-input"
                    placeholder="e.g. From May 22 to June 2, the client wants LA for 3 days then Arizona"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={pending}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.metaKey || e.ctrlKey) &&
                        prompt.trim() &&
                        !pending
                      ) {
                        e.preventDefault();
                        propose();
                      }
                    }}
                  />
                  <div className="builder-suggest">
                    <span>Try:</span>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="builder-suggest-chip"
                        onClick={() => setPrompt(s)}
                        disabled={pending}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <ProposalView proposal={proposal} />
              )}
            </div>

            <div className="modal-actions">
              {proposal ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setProposal(null)}
                    disabled={pending}
                  >
                    Refine prompt
                  </button>
                  <button
                    type="button"
                    className="btn btn-forest"
                    onClick={create}
                    disabled={pending}
                  >
                    {pending ? "Creating…" : "Create & open"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => !pending && setOpen(false)}
                    disabled={pending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-forest"
                    onClick={propose}
                    disabled={pending || !prompt.trim()}
                  >
                    {pending ? "Composing…" : "Compose trip"}
                  </button>
                </>
              )}
              {error ? <span className="modal-err">{error}</span> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ProposalView({ proposal }: { proposal: TripBuilderOutput }) {
  const conf = proposal.confidence;
  return (
    <div className="proposal">
      <div className="proposal-name">{proposal.name}</div>
      <div className="proposal-summary">{proposal.summary}</div>

      <dl className="proposal-fields">
        <div>
          <dt>Destination</dt>
          <dd>
            {proposal.destination}
            <ConfidencePill level={conf.destination} />
          </dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            {proposal.startDate ?? "—"} → {proposal.endDate ?? "—"}
            <ConfidencePill level={conf.dates} />
          </dd>
        </div>
        <div>
          <dt>Travelers</dt>
          <dd>
            {proposal.travelerCount}
            <ConfidencePill level={conf.travelers} />
          </dd>
        </div>
        <div>
          <dt>Budget</dt>
          <dd>
            {proposal.budgetUsd != null
              ? `$${proposal.budgetUsd.toLocaleString("en-US")}`
              : "—"}
          </dd>
        </div>
      </dl>

      {proposal.segments.length > 1 ? (
        <div className="proposal-section">
          <div className="proposal-section-label">Legs</div>
          <ol className="proposal-legs">
            {proposal.segments.map((s, i) => (
              <li key={i}>
                <span className="proposal-leg-num">{i + 1}</span>
                <div>
                  <div className="proposal-leg-dest">{s.destination}</div>
                  <div className="proposal-leg-meta">
                    {s.days} day{s.days === 1 ? "" : "s"}
                    {s.notes ? ` · ${s.notes}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {proposal.unresolved.length > 0 ? (
        <div className="proposal-unresolved">
          <div className="proposal-section-label">To clarify</div>
          <ul>
            {proposal.unresolved.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ConfidencePill({ level }: { level: "high" | "medium" | "low" }) {
  return (
    <span className={`conf-pill conf-${level}`} title={`Confidence: ${level}`}>
      {level}
    </span>
  );
}
