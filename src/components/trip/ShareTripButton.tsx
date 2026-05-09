"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  createShareTokenAction,
  revokeShareTokenAction,
} from "@/app/(app)/trip/share-actions";
import type { tripShareTokens } from "@/lib/db/schema";

type Token = typeof tripShareTokens.$inferSelect;

export function ShareTripButton({
  tripId,
  existingTokens,
}: {
  tripId: string;
  existingTokens: Token[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [latestToken, setLatestToken] = useState<string | null>(
    existingTokens.find((t) => !t.revokedAt)?.token ?? null,
  );
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const url =
    latestToken && typeof window !== "undefined"
      ? `${window.location.origin}/share/trip/${latestToken}`
      : null;

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      const r = await createShareTokenAction(tripId);
      if (r.ok) setLatestToken(r.token);
      else setError(r.error);
    });
  };

  const handleRevoke = (id: string) => {
    setError(null);
    startTransition(async () => {
      const r = await revokeShareTokenAction(id);
      if (r.ok) setLatestToken(null);
      else setError(r.error);
    });
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="share-btn-wrap" ref={popoverRef}>
      <button
        type="button"
        className="share-btn"
        onClick={() => setOpen((v) => !v)}
      >
        Share with client
      </button>
      {open ? (
        <div className="share-popover">
          {url ? (
            <>
              <div className="share-pop-label">Client link</div>
              <div className="share-pop-url">
                <input value={url} readOnly />
                <button
                  type="button"
                  className="btn btn-forest"
                  onClick={copy}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="share-pop-actions">
                <button
                  type="button"
                  className="link-btn"
                  disabled={pending}
                  onClick={handleGenerate}
                >
                  {pending ? "…" : "Generate new (revokes others later)"}
                </button>
                {existingTokens
                  .filter((t) => !t.revokedAt && t.token === latestToken)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className="link-btn link-btn-danger"
                      disabled={pending}
                      onClick={() => handleRevoke(t.id)}
                    >
                      Revoke
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <>
              <div className="share-pop-label">No active link</div>
              <button
                type="button"
                className="btn btn-forest"
                disabled={pending}
                onClick={handleGenerate}
              >
                {pending ? "Generating…" : "Generate share link"}
              </button>
            </>
          )}
          {error ? <div className="share-pop-err">{error}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
