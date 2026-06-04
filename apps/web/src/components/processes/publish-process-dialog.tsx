"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/primary-button";

type PublishProcessDialogProps = {
  open: boolean;
  processName: string;
  busy?: boolean;
  onClose: () => void;
  onPublish: (input: {
    effectiveDate: string;
    reviewDueDate?: string;
  }) => void;
};

export function PublishProcessDialog({
  open,
  processName,
  busy = false,
  onClose,
  onPublish,
}: PublishProcessDialogProps) {
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  function handleSubmit() {
    if (!effectiveDate.trim()) {
      setValidationError("Effective date is required before this SOP can go live.");
      return;
    }
    setValidationError(null);
    onPublish({
      effectiveDate: effectiveDate.trim(),
      reviewDueDate: reviewDueDate.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-lg">
        <h2 id="publish-dialog-title" className="text-lg font-semibold text-slate-950">
          Publish SOP
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Make <span className="font-medium text-slate-800">{processName}</span> active.
          Approved versions go live with the dates you set below.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">Effective date</span>
            <input
              type="date"
              value={effectiveDate}
              onChange={(event) => setEffectiveDate(event.target.value)}
              className="h-10 rounded-md border border-border px-3"
              data-testid="publish-effective-date"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium text-slate-800">Review due date (optional)</span>
            <input
              type="date"
              value={reviewDueDate}
              onChange={(event) => setReviewDueDate(event.target.value)}
              className="h-10 rounded-md border border-border px-3"
              data-testid="publish-review-due-date"
            />
          </label>

          {validationError ? (
            <p className="text-sm text-red-600" data-testid="publish-validation-error">
              {validationError}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            data-testid="publish-confirm"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-teal px-4 text-sm font-medium text-white disabled:opacity-60"
            onClick={handleSubmit}
          >
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
