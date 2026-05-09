"use client";

import { useState } from "react";
import type { agentConfigs, modelProviders } from "@/lib/db/schema";
import { updateAgentConfig } from "@/app/(app)/admin/models/actions";

type Provider = typeof modelProviders.$inferSelect;
type AgentConfig = typeof agentConfigs.$inferSelect & { provider: Provider };

export function AgentConfigRow({
  config,
  providers,
  label,
}: {
  config: AgentConfig;
  providers: Provider[];
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    const settings = (config.settings ?? {}) as {
      temperature?: number;
      maxTokens?: number;
    };
    return (
      <tr>
        <td className="agent-cell">{label}</td>
        <td>{config.provider.displayName}</td>
        <td><code>{config.modelName}</code></td>
        <td>{settings.temperature ?? "—"}</td>
        <td>{settings.maxTokens ?? "—"}</td>
        <td className="prompt-preview">
          {config.systemPrompt
            ? config.systemPrompt.slice(0, 80) +
              (config.systemPrompt.length > 80 ? "…" : "")
            : "—"}
        </td>
        <td className="row-actions">
          <button className="link-btn" onClick={() => setEditing(true)}>
            edit
          </button>
        </td>
      </tr>
    );
  }

  const settings = (config.settings ?? {}) as {
    temperature?: number;
    maxTokens?: number;
  };

  return (
    <tr>
      <td colSpan={7}>
        <form
          className="admin-form"
          action={async (fd) => {
            setError(null);
            fd.set("agentType", config.agentType);
            const r = await updateAgentConfig(fd);
            if (r.ok) setEditing(false);
            else setError(r.error);
          }}
        >
          <div className="form-row">
            <label>Agent</label>
            <input value={label} disabled />
          </div>
          <div className="form-row">
            <label>Provider</label>
            <select name="providerId" defaultValue={config.providerId}>
              {providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.enabled}>
                  {p.displayName} ({p.slug}){!p.enabled ? " · disabled" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Model name</label>
            <input
              name="modelName"
              defaultValue={config.modelName}
              required
              placeholder="e.g. gemini-3.1-flash"
            />
          </div>
          <div className="form-row">
            <label>Temperature</label>
            <input
              name="temperature"
              type="number"
              step="0.1"
              defaultValue={settings.temperature ?? ""}
              placeholder="0.4"
            />
          </div>
          <div className="form-row">
            <label>Max tokens</label>
            <input
              name="maxTokens"
              type="number"
              defaultValue={settings.maxTokens ?? ""}
              placeholder="2048"
            />
          </div>
          <div className="form-row">
            <label>System prompt</label>
            <textarea
              name="systemPrompt"
              rows={5}
              defaultValue={config.systemPrompt ?? ""}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-forest">Save</button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            {error ? <span className="err">{error}</span> : null}
          </div>
        </form>
      </td>
    </tr>
  );
}
