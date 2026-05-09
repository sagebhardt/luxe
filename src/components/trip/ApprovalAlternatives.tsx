"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";

type Alt = {
  headline?: string;
  name?: string;
  priceCents?: number;
  note?: string;
};

export function ApprovalAlternatives({ alternatives }: { alternatives: Alt[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="appr-alts">
      <button
        type="button"
        className="appr-alts-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide" : "Show"} {alternatives.length} alternative
        {alternatives.length === 1 ? "" : "s"}
      </button>
      {open ? (
        <ul className="appr-alts-list">
          {alternatives.map((a, i) => {
            const label = a.headline ?? a.name ?? "Alternative";
            return (
              <li key={i}>
                <span className="appr-alts-name">{label}</span>
                {a.priceCents != null ? (
                  <span className="appr-alts-price">
                    {formatMoney(a.priceCents)}
                  </span>
                ) : null}
                {a.note ? <span className="appr-alts-note">{a.note}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
