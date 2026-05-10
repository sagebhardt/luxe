"use client";

import { useState, useTransition } from "react";
import { submitNpsAction } from "@/app/share/trip/[token]/actions";

export function NpsForm({
  token,
  clientFirstName,
}: {
  token: string;
  clientFirstName: string;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <section className="share-section">
        <div className="share-nps">
          <p className="share-nps-done">
            Thank you — your designer has been notified.
          </p>
        </div>
      </section>
    );
  }

  const submit = () => {
    if (score == null) {
      setError("Please choose a number between 0 and 10.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitNpsAction({
        token,
        score,
        comment: comment.trim() || null,
      });
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <section className="share-section">
      <div className="share-section-eyebrow">A few words</div>
      <h2 className="share-section-title">How was the trip?</h2>
      <div className="share-nps">
        <p className="share-nps-thanks">
          {clientFirstName}, your honest read shapes everything we do next.
        </p>
        <p className="share-nps-prompt">
          On a scale of 0 to 10, how likely are you to recommend us to a
          friend?
        </p>
        <div className="share-nps-scale">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setScore(i)}
              className={`share-nps-num${score === i ? " is-active" : ""}`}
              aria-pressed={score === i}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="share-nps-scale-axis">
          <span>Not likely</span>
          <span>Extremely likely</span>
        </div>
        <textarea
          className="share-nps-comment"
          placeholder="Anything you'd like to share — what worked, what didn't, what we should do differently next time."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
        />
        {error ? <div className="share-nps-err">{error}</div> : null}
        <div className="share-nps-actions">
          <button
            type="button"
            onClick={submit}
            disabled={pending || score == null}
            className="share-nps-submit"
          >
            {pending ? "Sending…" : "Send to my designer"}
          </button>
        </div>
      </div>
    </section>
  );
}
