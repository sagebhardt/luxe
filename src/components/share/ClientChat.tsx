"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendClientMessageAction } from "@/app/share/trip/[token]/actions";
import type { agentLogMessages } from "@/lib/db/schema";

type Message = typeof agentLogMessages.$inferSelect;

const AVATAR_GLYPH: Record<Message["avatar"], string> = {
  orchestrator: "✦",
  sub_agent: "⚙",
  client: "·",
};

const AVATAR_CLASS: Record<Message["avatar"], string> = {
  orchestrator: "share-av-ag",
  sub_agent: "share-av-sys",
  client: "share-av-client",
};

export function ClientChat({
  tripId,
  token,
  initialMessages,
}: {
  tripId: string;
  token: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setText("");
    setError(null);

    /* Optimistic client message */
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      tripId,
      avatar: "client",
      body: q,
      occurredAt: new Date(),
    };
    setMessages((prev) => [...prev, optimistic]);

    startTransition(async () => {
      const r = await sendClientMessageAction({ token, message: q });
      if (r.ok) {
        setMessages(r.messages);
      } else {
        setError(r.error);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      }
    });
  };

  return (
    <div className="share-chat">
      <div className="share-chat-area">
        {messages.length === 0 ? (
          <div className="share-chat-empty">
            No messages yet. Start with a question below.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="share-msg">
              <div className={`share-av ${AVATAR_CLASS[m.avatar]}`}>
                {AVATAR_GLYPH[m.avatar]}
              </div>
              <div className="share-msg-body">
                <div
                  className="share-msg-bub"
                  dangerouslySetInnerHTML={{ __html: m.body }}
                />
                <div className="share-msg-time">
                  {new Date(m.occurredAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="share-chat-input-row">
        <input
          className="share-chat-inp"
          placeholder={pending ? "Thinking…" : "Ask about your trip…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={pending}
        />
        <button
          type="submit"
          className="share-send-btn"
          disabled={pending || !text.trim()}
          aria-label="Send"
        >
          ↑
        </button>
      </form>
      {error ? <div className="share-chat-err">{error}</div> : null}
    </div>
  );
}
