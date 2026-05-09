"use client";

import { useState, useTransition } from "react";
import { saveNoteAction } from "@/app/(app)/clients/actions";

export function QuickNote({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const firstName = clientName.split(" ")[0];

  const submit = () => {
    if (!value.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const r = await saveNoteAction(clientId, value);
      if (r.ok) {
        setValue("");
        setSavedAt(new Date());
      } else {
        setError(r.error);
      }
    });
  };

  return (
    <>
      <textarea
        className="note-area"
        placeholder={`Add a note about ${firstName}…`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
      />
      <div className="quick-note-row">
        <button
          type="button"
          className="btn btn-outline"
          style={{ marginTop: 9, fontSize: 10 }}
          onClick={submit}
          disabled={pending || !value.trim()}
        >
          {pending ? "Saving…" : "Save Note"}
        </button>
        {savedAt ? (
          <span className="quick-note-saved">Saved · added to activity</span>
        ) : null}
        {error ? <span className="quick-note-err">{error}</span> : null}
      </div>
    </>
  );
}
