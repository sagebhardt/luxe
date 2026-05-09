"use client";

import { useState, useTransition } from "react";
import { runAgentAction, type AgentKind } from "@/app/(app)/trip/actions";

export function AgentRunButton({
  agent,
  tripId,
  hasRun,
}: {
  agent: AgentKind;
  tripId: string;
  hasRun: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="ag-run-row">
      <button
        type="button"
        className="ag-run-btn"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const r = await runAgentAction(agent, tripId);
            if (!r.ok) setError(r.error);
          });
        }}
      >
        {pending ? "Running…" : hasRun ? "Re-run" : "Run"}
      </button>
      {error ? <div className="ag-run-err">{error}</div> : null}
    </div>
  );
}
