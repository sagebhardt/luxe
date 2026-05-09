"use client";

import { useState } from "react";

export function QuickNote({ clientName }: { clientName: string }) {
  const [value, setValue] = useState("");
  const firstName = clientName.split(" ")[0];
  return (
    <>
      <textarea
        className="note-area"
        placeholder={`Add a note about ${firstName}…`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="button"
        className="btn btn-outline"
        style={{ marginTop: 9, fontSize: 10 }}
        onClick={() => {
          // Persist later — placeholder for now
          setValue("");
        }}
      >
        Save Note
      </button>
    </>
  );
}
