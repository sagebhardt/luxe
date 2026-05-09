"use client";

import { useState, useTransition } from "react";
import { generateNarrativeAction } from "@/app/(app)/trip/narrative-actions";

export function GenerateNarrativeButton({
  tripId,
  generatedAt,
}: {
  tripId: string;
  generatedAt: Date | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const label = generatedAt ? "Refresh narrative" : "Generate narrative";

  return (
    <div className="narrative-btn-wrap">
      <button
        type="button"
        className="narrative-btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await generateNarrativeAction(tripId);
            if (!r.ok) setError(r.error);
          });
        }}
      >
        {pending ? "Composing…" : label}
      </button>
      {generatedAt && !pending ? (
        <span className="narrative-stamp">
          Generated {timeAgo(generatedAt)}
        </span>
      ) : null}
      {error ? <span className="narrative-err">{error}</span> : null}
    </div>
  );
}

function timeAgo(d: Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}
