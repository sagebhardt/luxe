"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { askCrmAction, type CrmQueryResult } from "@/app/(app)/clients/query-actions";
import { formatMoneyShort } from "@/lib/format";

export function AskCrm() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CrmQueryResult | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    startTransition(async () => {
      const r = await askCrmAction(question);
      setResult(r);
    });
  };

  return (
    <>
      <button type="button" className="ask-crm-trigger" onClick={() => setOpen(true)}>
        Ask CRM
      </button>

      {open ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="modal-card ask-crm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h2 className="modal-title">Ask CRM</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => !pending && setOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={submit} className="ask-form">
              <input
                autoFocus
                className="ask-input"
                placeholder="e.g. show me dormant clients with NPS over 80"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={pending}
              />
              <button
                type="submit"
                className="btn btn-forest"
                disabled={pending || !question.trim()}
              >
                {pending ? "Querying…" : "Ask"}
              </button>
            </form>
            <div className="ask-suggest">
              <span>Try:</span>
              {[
                "VIP clients with NPS over 90",
                "active trips to Japan",
                "clients with lifetime value over $40,000",
                "trips with budget under $10,000",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="ask-suggest-chip"
                  onClick={() => setQuestion(s)}
                  disabled={pending}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="ask-results">
              {result && result.ok ? (
                <ResultsView result={result} />
              ) : result && !result.ok ? (
                <div className="ask-err">{result.error}</div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultsView({
  result,
}: {
  result: Extract<CrmQueryResult, { ok: true }>;
}) {
  const { plan, rows } = result;
  return (
    <div>
      <div className="ask-plan">
        <div className="ask-plan-line">
          <span className="ask-plan-label">Intent</span>
          <span>{plan.intent}</span>
        </div>
        <div className="ask-plan-line">
          <span className="ask-plan-label">Reasoning</span>
          <span>{plan.reasoning}</span>
        </div>
        <div className="ask-plan-line">
          <span className="ask-plan-label">Plan</span>
          <code>
            {plan.table}
            {plan.filters.length
              ? ` where ${plan.filters
                  .map(
                    (f) =>
                      `${f.field} ${f.op} ${
                        Array.isArray(f.value)
                          ? `[${f.value.join(",")}]`
                          : JSON.stringify(f.value)
                      }`,
                  )
                  .join(" AND ")}`
              : ""}
            {plan.orderBy
              ? ` order by ${plan.orderBy.field} ${plan.orderBy.direction}`
              : ""}
            {` limit ${plan.limit}`}
          </code>
        </div>
      </div>

      <div className="ask-count">
        {rows.length} result{rows.length === 1 ? "" : "s"}
      </div>

      {plan.table === "clients" ? (
        <ClientResults rows={rows as ClientLikeRow[]} />
      ) : (
        <TripResults rows={rows as TripLikeRow[]} />
      )}
    </div>
  );
}

type ClientLikeRow = {
  id: string;
  name: string;
  tag: string;
  lifetimeValueCents: number;
  npsScore: number | null;
  notes: string | null;
};

type TripLikeRow = {
  id: string;
  clientId: string;
  name: string;
  destination: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  travelerCount: number;
  budgetCents: number | null;
};

function ClientResults({ rows }: { rows: ClientLikeRow[] }) {
  if (rows.length === 0) return <div className="ask-empty">No matches.</div>;
  return (
    <table className="ask-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Tag</th>
          <th>LTV</th>
          <th>NPS</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <Link href={`/clients?id=${r.id}`}>{r.name}</Link>
            </td>
            <td>{r.tag}</td>
            <td>{formatMoneyShort(r.lifetimeValueCents)}</td>
            <td>{r.npsScore ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TripResults({ rows }: { rows: TripLikeRow[] }) {
  if (rows.length === 0) return <div className="ask-empty">No matches.</div>;
  return (
    <table className="ask-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Destination</th>
          <th>Status</th>
          <th>Dates</th>
          <th>Budget</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>
              <Link href={`/trip?id=${r.id}`}>{r.name}</Link>
            </td>
            <td>{r.destination}</td>
            <td>{r.status}</td>
            <td>
              {r.startDate ?? "?"} → {r.endDate ?? "?"}
            </td>
            <td>{r.budgetCents != null ? formatMoneyShort(r.budgetCents) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
