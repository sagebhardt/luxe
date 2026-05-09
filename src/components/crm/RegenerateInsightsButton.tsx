"use client";

import { useState, useTransition } from "react";
import { regenerateInsightsAction } from "@/app/(app)/clients/insight-actions";

export function RegenerateInsightsButton({
  clientId,
}: {
  clientId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="regen-row">
      <button
        type="button"
        className="regen-btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await regenerateInsightsAction(clientId);
            if (!r.ok) setError(r.error);
          });
        }}
      >
        {pending ? "Analyzing…" : "Regenerate"}
      </button>
      {error ? <span className="regen-err">{error}</span> : null}
    </div>
  );
}
