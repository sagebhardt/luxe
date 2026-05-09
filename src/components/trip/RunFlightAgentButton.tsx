"use client";

import { useState, useTransition } from "react";
import { runFlightAgentAction } from "@/app/(app)/trip/actions";

export function RunFlightAgentButton({ tripId }: { tripId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const res = await runFlightAgentAction(tripId);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="btn btn-forest"
      >
        {pending ? "Running…" : "Run Flight Agent"}
      </button>
      {error ? (
        <span style={{ fontSize: 11, color: "var(--rust)" }}>{error}</span>
      ) : null}
    </div>
  );
}
