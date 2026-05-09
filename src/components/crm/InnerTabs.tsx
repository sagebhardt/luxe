"use client";

import { useState } from "react";

const TABS = ["Trip History", "Preferences", "Notes & Calls", "Documents"] as const;

export function InnerTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]>("Trip History");
  return (
    <div className="inner-tabs">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          className={`itab${t === active ? " active" : ""}`}
          onClick={() => setActive(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
