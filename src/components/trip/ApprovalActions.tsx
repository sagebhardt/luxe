"use client";

import { useState, useTransition } from "react";
import {
  approveDecisionAction,
  dismissDecisionAction,
} from "@/app/(app)/trip/decision-actions";

export function ApprovalActions({ decisionId }: { decisionId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handle = (action: "approve" | "dismiss") => {
    setError(null);
    startTransition(async () => {
      const fn =
        action === "approve" ? approveDecisionAction : dismissDecisionAction;
      const r = await fn(decisionId);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="appr-actions-col">
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-forest"
          disabled={pending}
          onClick={() => handle("approve")}
        >
          {pending ? "…" : "Approve & Book"}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          disabled={pending}
          onClick={() => handle("dismiss")}
        >
          Dismiss
        </button>
      </div>
      {error ? <div className="appr-action-err">{error}</div> : null}
    </div>
  );
}
