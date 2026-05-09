import { formatHHmm } from "@/lib/format";
import type { agentLogMessages } from "@/lib/db/schema";

type Message = typeof agentLogMessages.$inferSelect;

export function AgentLog({ messages }: { messages: Message[] }) {
  return (
    <div className="chat-area">
      {messages.map((m) => (
        <div key={m.id} className="msg">
          <div
            className={`msg-av ${
              m.avatar === "orchestrator"
                ? "av-ag"
                : m.avatar === "client"
                  ? "av-client"
                  : "av-sys"
            }`}
          >
            {m.avatar === "orchestrator"
              ? "✦"
              : m.avatar === "client"
                ? "·"
                : "⚙"}
          </div>
          <div className="msg-body">
            <div
              className="msg-bub"
              dangerouslySetInnerHTML={{ __html: m.body }}
            />
            <div className="msg-time">{formatHHmm(new Date(m.occurredAt))}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
