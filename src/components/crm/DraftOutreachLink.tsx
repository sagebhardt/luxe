"use client";

import { useState, useTransition } from "react";
import { composeOutreachAction } from "@/app/(app)/clients/outreach-actions";

export function DraftOutreachLink({
  clientId,
  insightId,
}: {
  clientId: string;
  insightId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="draft-link-wrap">
      <button
        type="button"
        className="draft-link"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await composeOutreachAction({
              clientId,
              insightId,
              channel: "email",
            });
            if (!r.ok) setError(r.error);
          });
        }}
      >
        {pending ? "drafting…" : "draft outreach"}
      </button>
      {error ? <span className="draft-err">{error}</span> : null}
    </span>
  );
}
