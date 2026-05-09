"use client";

import { useState, useTransition } from "react";
import {
  discardDraftAction,
  markDraftSentAction,
  updateDraftBodyAction,
} from "@/app/(app)/clients/outreach-actions";
import type { outreachDrafts } from "@/lib/db/schema";

type Draft = typeof outreachDrafts.$inferSelect;

export function DraftCard({ draft }: { draft: Draft }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(draft.body);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isSent = draft.status === "sent";

  return (
    <div className={`draft-card${isSent ? " sent" : ""}`}>
      <div className="draft-head">
        <div className="draft-meta">
          <span className="draft-channel">{draft.channel}</span>
          {draft.tone ? (
            <span className="draft-tone">{draft.tone.replace("_", " ")}</span>
          ) : null}
          {isSent ? <span className="draft-sent-pill">sent</span> : null}
        </div>
        <div className="draft-actions">
          {!isSent ? (
            editing ? (
              <>
                <button
                  className="link-btn"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const r = await updateDraftBodyAction(draft.id, body);
                      if (r.ok) setEditing(false);
                      else setError(r.error);
                    });
                  }}
                >
                  {pending ? "saving…" : "save"}
                </button>
                <button
                  className="link-btn"
                  disabled={pending}
                  onClick={() => {
                    setBody(draft.body);
                    setEditing(false);
                  }}
                >
                  cancel
                </button>
              </>
            ) : (
              <>
                <button className="link-btn" onClick={() => setEditing(true)}>
                  edit
                </button>
                <button
                  className="link-btn"
                  disabled={pending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const r = await markDraftSentAction(draft.id);
                      if (!r.ok) setError(r.error);
                    });
                  }}
                >
                  mark sent
                </button>
                <button
                  className="link-btn link-btn-danger"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Discard this draft?")) return;
                    setError(null);
                    startTransition(async () => {
                      const r = await discardDraftAction(draft.id);
                      if (!r.ok) setError(r.error);
                    });
                  }}
                >
                  discard
                </button>
              </>
            )
          ) : null}
        </div>
      </div>
      {draft.subject ? (
        <div className="draft-subject">{draft.subject}</div>
      ) : null}
      {editing ? (
        <textarea
          className="draft-body-edit"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
        />
      ) : (
        <div className="draft-body">{draft.body}</div>
      )}
      {error ? <div className="draft-err">{error}</div> : null}
    </div>
  );
}
