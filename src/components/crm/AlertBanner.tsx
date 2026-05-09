"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  dismissAlertAction,
  runMonitorNowAction,
} from "@/app/(app)/clients/monitor-actions";
import type { proactiveAlerts, clients } from "@/lib/db/schema";

type Alert = typeof proactiveAlerts.$inferSelect & {
  client: typeof clients.$inferSelect;
};

const KIND_GLYPH: Record<string, string> = {
  anniversary: "🌿",
  trip_imminent: "✈",
  dormancy: "·",
  nps_attention: "!",
  high_value_inactive: "★",
};

const SEVERITY_CLASS: Record<string, string> = {
  info: "alert-info",
  warn: "alert-warn",
  urgent: "alert-urgent",
};

export function AlertBanner({ alerts }: { alerts: Alert[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const visible = alerts.filter((a) => !hidden.has(a.id));

  const dismiss = (id: string) => {
    setHidden((h) => new Set([...h, id]));
    startTransition(async () => {
      await dismissAlertAction(id);
    });
  };

  const runScan = () => {
    setScanResult(null);
    startTransition(async () => {
      const r = await runMonitorNowAction();
      if (r.ok) {
        setScanResult(
          `Scanned ${r.clientsScanned} clients · ${r.alertsCreated} new alert${r.alertsCreated === 1 ? "" : "s"}`,
        );
      } else {
        setScanResult(`Error: ${r.error}`);
      }
    });
  };

  return (
    <section className="alert-banner">
      <div className="alert-banner-head">
        <div>
          <div className="alert-banner-eyebrow">Proactive monitoring</div>
          <div className="alert-banner-title">
            {visible.length === 0
              ? "Nothing demands attention"
              : `${visible.length} alert${visible.length === 1 ? "" : "s"} to review`}
          </div>
        </div>
        <button
          type="button"
          className="alert-scan-btn"
          onClick={runScan}
          disabled={pending}
        >
          {pending ? "Scanning…" : "Scan now"}
        </button>
      </div>
      {scanResult ? <div className="alert-scan-result">{scanResult}</div> : null}
      {visible.length > 0 ? (
        <ul className="alert-list">
          {visible.map((a) => (
            <li
              key={a.id}
              className={`alert-card ${SEVERITY_CLASS[a.severity] ?? "alert-info"}`}
            >
              <div className="alert-glyph" aria-hidden="true">
                {KIND_GLYPH[a.kind] ?? "•"}
              </div>
              <div className="alert-body">
                <Link
                  href={`/clients?id=${a.clientId}`}
                  className="alert-client"
                >
                  {a.client.name}
                </Link>
                <div className="alert-title">{a.title}</div>
                <div className="alert-text">{a.body}</div>
                {a.suggestedAction ? (
                  <div className="alert-action">{a.suggestedAction}</div>
                ) : null}
              </div>
              <button
                type="button"
                className="alert-dismiss"
                onClick={() => dismiss(a.id)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
