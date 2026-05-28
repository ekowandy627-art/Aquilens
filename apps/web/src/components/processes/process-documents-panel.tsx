"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiUpload } from "@/lib/api-client";

export type ProcessDocument = {
  id: string;
  filename: string;
  storagePath: string;
  mimeType?: string;
  byteSize?: number;
  uploadedBy?: string;
  createdAt: string;
};

type ProcessDocumentsPanelProps = {
  processId: string;
  canUpload: boolean;
};

function formatBytes(bytes?: number) {
  if (!bytes) {
    return "—";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function ProcessDocumentsPanel({
  processId,
  canUpload,
}: ProcessDocumentsPanelProps) {
  const [documents, setDocuments] = useState<ProcessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const rows = await apiFetch<ProcessDocument[]>(`/processes/${processId}/documents`);
    setDocuments(rows);
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load documents",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [processId]);

  async function onFileSelected(file: File | null) {
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiUpload<ProcessDocument>(`/processes/${processId}/documents`, formData);
      await reload();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="process-documents-panel">
      {canUpload ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-bg px-4 py-8 text-center hover:border-brand-teal">
          <span className="text-sm font-medium text-slate-800">
            {uploading ? "Uploading…" : "Drag a PDF or document here, or click to browse"}
          </span>
          <span className="mt-1 text-xs text-text-muted">Max 5MB</span>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,application/pdf"
            disabled={uploading}
            data-testid="process-document-upload"
            onChange={(event) => void onFileSelected(event.target.files?.[0] ?? null)}
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-text-muted">Loading documents…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-text-muted">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              data-testid="process-document-row"
            >
              <div>
                <p className="font-medium text-slate-950">{document.filename}</p>
                <p className="text-xs text-text-muted">
                  {formatBytes(document.byteSize)} ·{" "}
                  {new Date(document.createdAt).toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
