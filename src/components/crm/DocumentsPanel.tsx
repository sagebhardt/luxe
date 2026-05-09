"use client";

import { useRef, useState, useTransition } from "react";
import {
  deleteDocumentAction,
  uploadDocumentAction,
} from "@/app/(app)/clients/document-actions";
import type { DocumentRow } from "@/lib/queries/documents";

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

  const onFileChosen = (file: File) => {
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("file", file);
    setError(null);
    startTransition(async () => {
      const r = await uploadDocumentAction(fd);
      if (!r.ok) setError(r.error);
      if (fileRef.current) fileRef.current.value = "";
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
            ? "Uploading…"
            : "PDF / image / docx, up to 25 MB. Auto-classified after upload."}
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
  const expiresWarn =
    doc.expiresOn &&
    new Date(doc.expiresOn).getTime() < Date.now() + 1000 * 60 * 60 * 24 * 90;
  const downloadUrl = `/api/documents/${doc.id}/download`;

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
          {doc.summary ? <> · {doc.summary}</> : null}
        </div>
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
