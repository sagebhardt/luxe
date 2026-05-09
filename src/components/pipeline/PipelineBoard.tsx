"use client";

import { useMemo, useState, useTransition } from "react";
import {
  STAGES,
  STAGE_LABELS,
  type PipelineCard as Card,
  type Stage,
} from "@/lib/pipeline";
import { updateClientStageAction } from "@/app/(app)/pipeline/actions";
import { PipelineCardView } from "./PipelineCard";

export function PipelineBoard({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [hoverStage, setHoverStage] = useState<Stage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const byStage = useMemo(() => {
    const m: Record<Stage, Card[]> = {
      lead: [],
      discovery: [],
      proposing: [],
      booked: [],
      traveling: [],
      returning: [],
      dormant: [],
    };
    for (const c of cards) m[c.stage].push(c);
    return m;
  }, [cards]);

  const sums = useMemo(() => {
    const m: Record<Stage, number> = {
      lead: 0,
      discovery: 0,
      proposing: 0,
      booked: 0,
      traveling: 0,
      returning: 0,
      dormant: 0,
    };
    for (const c of cards) {
      m[c.stage] += c.currentDealCents ?? c.lifetimeValueCents ?? 0;
    }
    return m;
  }, [cards]);

  const handleDrop = (stage: Stage, e: React.DragEvent) => {
    e.preventDefault();
    setHoverStage(null);
    const id = e.dataTransfer.getData("text/clientId");
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;

    /* Optimistic move */
    const prevStage = card.stage;
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage } : c)),
    );

    setError(null);
    startTransition(async () => {
      const r = await updateClientStageAction(id, stage);
      if (!r.ok) {
        /* revert */
        setCards((prev) =>
          prev.map((c) => (c.id === id ? { ...c, stage: prevStage } : c)),
        );
        setError(r.error);
      }
    });
  };

  return (
    <>
      {error ? <div className="pipeline-err">{error}</div> : null}
      <div className="pipeline-board">
        {STAGES.map((stage) => {
          const list = byStage[stage];
          const sum = sums[stage];
          return (
            <div
              key={stage}
              className={`pipeline-col${hoverStage === stage ? " drag-over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setHoverStage(stage);
              }}
              onDragLeave={() => setHoverStage(null)}
              onDrop={(e) => handleDrop(stage, e)}
            >
              <header className="pipeline-col-head">
                <div className="pipeline-col-title">{STAGE_LABELS[stage]}</div>
                <div className="pipeline-col-meta">
                  <span className="pipeline-col-count">{list.length}</span>
                  {sum > 0 ? (
                    <span className="pipeline-col-sum">
                      ${(sum / 100).toLocaleString("en-US")}
                    </span>
                  ) : null}
                </div>
              </header>
              <div className="pipeline-col-list">
                {list.length === 0 ? (
                  <div className="pipeline-col-empty">—</div>
                ) : (
                  list.map((card) => (
                    <PipelineCardView key={card.id} card={card} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
