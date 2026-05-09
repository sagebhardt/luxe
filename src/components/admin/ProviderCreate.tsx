"use client";

import { useState } from "react";
import { createProvider } from "@/app/(app)/admin/models/actions";

export function ProviderCreate() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="add-row">
        <button className="btn btn-outline" onClick={() => setOpen(true)}>
          + Add Provider
        </button>
      </div>
    );
  }

  return (
    <form
      className="admin-form add-form"
      action={async (fd) => {
        setError(null);
        const r = await createProvider(fd);
        if (r.ok) {
          setOpen(false);
          (document.activeElement as HTMLElement | null)?.blur();
        } else setError(r.error);
      }}
    >
      <div className="form-row">
        <label>Slug</label>
        <input name="slug" placeholder="e.g. openai-prod" required />
      </div>
      <div className="form-row">
        <label>Display name</label>
        <input name="displayName" required />
      </div>
      <div className="form-row">
        <label>Kind</label>
        <select name="kind" defaultValue="google_vertex">
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
          placeholder={'{"project":"luxe-travel","location":"us-central1"}'}
        />
      </div>
      <div className="form-row">
        <label>Credentials env var</label>
        <input
          name="credentialsEnvVar"
          placeholder="e.g. OPENAI_API_KEY"
        />
      </div>
      <div className="form-row checkbox">
        <label>
          <input type="checkbox" name="enabled" defaultChecked /> Enabled
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-forest">Create</button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
        {error ? <span className="err">{error}</span> : null}
      </div>
    </form>
  );
}
