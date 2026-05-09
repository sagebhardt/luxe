"use client";

import { useRef, useState, useTransition } from "react";
import {
  deleteDocumentAction,
  uploadDocumentAction,
} from "@/app/(app)/clients/document-actions";
import type { DocumentRow } from "@/lib/queries/documents";
import { compressIfImage } from "@/lib/compress-image";

const KIND_LABEL: Record<string, string> = {
  passport: "Passport",
  visa: "Visa",
  id: "ID",
  voucher: "Voucher",
  ticket: "Ticket",
  insurance: "Insurance",
  contract: "Contract",
  receipt: "Receipt",
  photo: "Photo",
  other: "Other",
};

export function DocumentsPanel({
  clientId,
  documents: docs,
}: {
  clientId: string;
  documents: DocumentRow[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  const onFileChosen = (file: File) => {
    setError(null);
    startTransition(async () => {
      try {
        setStage("Preparing…");
        const { file: prepared, originalSize } = await compressIfImage(file);
        if (prepared !== file) {
          setStage(
            `Compressed ${(originalSize / 1024 / 1024).toFixed(1)} MB → ${Math.round(prepared.size / 1024)} KB`,
          );
        }
        setStage((s) => (s ? `${s} · Extracting…` : "Extracting…"));
        const fd = new FormData();
        fd.set("clientId", clientId);
        fd.set("file", prepared);
        fd.set("originalSize", String(originalSize));
        const r = await uploadDocumentAction(fd);
        if (!r.ok) setError(r.error);
      } finally {
        setStage(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  };

  return (
    <div>
      <div className="docs-toolbar">
        <input
          ref={fileRef}
          type="file"
          className="docs-file-input"
          disabled={pending}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.docx,.doc"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileChosen(f);
          }}
        />
        <span className="docs-hint">
          {pending
            ? (stage ?? "Uploading…")
            : "PDF / image / docx, up to 25 MB. Photos are compressed and key fields extracted automatically."}
        </span>
        {error ? <span className="docs-err">{error}</span> : null}
      </div>

      {docs.length === 0 ? (
        <div className="tab-empty">
          <p>
            No documents yet. Drop a passport scan, visa, or voucher to start
            building this client's vault.
          </p>
        </div>
      ) : (
        <ul className="docs-list">
          {docs.map((d) => (
            <DocRow key={d.id} doc={d} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocRow({ doc }: { doc: DocumentRow }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const remove = () => {
    if (!confirm(`Delete "${doc.fileName}"?`)) return;
    setError(null);
    startTransition(async () => {
      const r = await deleteDocumentAction(doc.id);
      if (!r.ok) setError(r.error);
    });
  };

  const sizeKb = doc.sizeBytes ? Math.round(doc.sizeBytes / 1024) : null;
  const origKb =
    doc.originalSizeBytes && doc.originalSizeBytes > (doc.sizeBytes ?? 0)
      ? Math.round(doc.originalSizeBytes / 1024)
      : null;
  const expiresWarn =
    doc.expiresOn &&
    new Date(doc.expiresOn).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 90;
  const downloadUrl = `/api/documents/${doc.id}/download`;
  const fields = doc.extractedFields ?? [];

  return (
    <li className="doc-row">
      <div className="doc-kind-pill">{KIND_LABEL[doc.kind] ?? doc.kind}</div>
      <div className="doc-body">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer"
          className="doc-name"
        >
          {doc.fileName}
        </a>
        <div className="doc-meta">
          {sizeKb != null ? `${sizeKb} KB` : ""}
          {origKb ? <> (from {origKb} KB)</> : null}
          {doc.summary ? <> · {doc.summary}</> : null}
        </div>
        {fields.length > 0 ? (
          <ul className="doc-fields">
            {fields.map((f, i) => (
              <li
                key={i}
                className={`doc-field${f.confidence === "low" ? " low" : ""}`}
                title={f.confidence === "low" ? "Low confidence" : undefined}
              >
                <span className="doc-field-label">{f.label}</span>
                <span className="doc-field-value">{f.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {doc.expiresOn ? (
          <div className={`doc-expiry${expiresWarn ? " warn" : ""}`}>
            Expires {doc.expiresOn}
            {expiresWarn ? " — review before next trip" : ""}
          </div>
        ) : null}
      </div>
      <div className="doc-actions">
        <button
          type="button"
          className="link-btn link-btn-danger"
          disabled={pending}
          onClick={remove}
        >
          {pending ? "…" : "delete"}
        </button>
        {error ? <div className="docs-err">{error}</div> : null}
      </div>
    </li>
  );
}
