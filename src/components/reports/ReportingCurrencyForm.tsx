"use client";

import { useTransition } from "react";
import { setReportingCurrencyAction } from "@/app/(app)/reports/settings-actions";
import { SUPPORTED_CURRENCIES } from "@/lib/format";

export function ReportingCurrencyForm({ current }: { current: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <label className="reports-ccy">
      <span className="reports-ccy-lbl">Report in</span>
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const next = e.currentTarget.value;
          startTransition(async () => {
            await setReportingCurrencyAction(next);
          });
        }}
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
