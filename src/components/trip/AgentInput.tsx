"use client";

import { useState } from "react";

export function AgentInput() {
  const [value, setValue] = useState("");
  return (
    <form
      className="chat-input-row"
      onSubmit={(e) => {
        e.preventDefault();
        // No backend wired yet — clear the input and hand off later.
        setValue("");
      }}
    >
      <input
        className="chat-inp"
        placeholder="Instruct agents…"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="send-btn" aria-label="Send">
        ↑
      </button>
    </form>
  );
}
