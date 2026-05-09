"use client";

import { useState, useTransition } from "react";
import type { modelProviders } from "@/lib/db/schema";
import { deleteProvider, updateProvider } from "@/app/(app)/admin/models/actions";

type Provider = typeof modelProviders.$inferSelect;

export function ProviderRow({ provider }: { provider: Provider }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <tr>
        <td><code>{provider.slug}</code></td>
        <td>{provider.displayName}</td>
        <td><span className="kind-pill">{provider.kind}</span></td>
        <td>
          <code className="config-preview">
            {provider.config ? JSON.stringify(provider.config) : "—"}
          </code>
        </td>
        <td>{provider.credentialsEnvVar ?? "—"}</td>
        <td>{provider.enabled ? "✓" : "—"}</td>
        <td className="row-actions">
          <button className="link-btn" onClick={() => setEditing(true)}>
            edit
          </button>
          <button
            className="link-btn link-btn-danger"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Delete provider "${provider.slug}"?`)) return;
              setError(null);
              startTransition(async () => {
                const r = await deleteProvider(provider.id);
                if (!r.ok) setError(r.error);
              });
            }}
          >
            {pending ? "deleting…" : "delete"}
          </button>
          {error ? <span className="err">{error}</span> : null}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={7}>
        <form
          className="admin-form"
          action={async (fd) => {
            setError(null);
            const r = await updateProvider(provider.id, fd);
            if (r.ok) setEditing(false);
            else setError(r.error);
          }}
        >
          <div className="form-row">
            <label>Slug</label>
            <input value={provider.slug} disabled />
          </div>
          <div className="form-row">
            <label>Display name</label>
            <input
              name="displayName"
              defaultValue={provider.displayName}
              required
            />
          </div>
          <div className="form-row">
            <label>Kind</label>
            <select name="kind" defaultValue={provider.kind}>
              <option value="google_vertex">google_vertex</option>
              <option value="google_ai">google_ai</option>
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
            </select>
          </div>
          <div className="form-row">
            <label>Config (JSON)</label>
            <textarea
              name="config"
              rows={3}
              defaultValue={
                provider.config ? JSON.stringify(provider.config, null, 2) : ""
              }
              placeholder={'{"project":"luxe-travel","location":"us-central1"}'}
            />
          </div>
          <div className="form-row">
            <label>Credentials env var</label>
            <input
              name="credentialsEnvVar"
              defaultValue={provider.credentialsEnvVar ?? ""}
              placeholder="e.g. GOOGLE_VERTEX_CREDENTIALS_JSON"
            />
          </div>
          <div className="form-row checkbox">
            <label>
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={provider.enabled}
              />{" "}
              Enabled
            </label>
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
