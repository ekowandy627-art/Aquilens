"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import {
  type AssignmentSopRead,
  confirmAcknowledgement,
  fetchAssignmentSop,
} from "@/lib/acknowledgements";

export default function AcknowledgementReadPage() {
  const params = useParams<{ assignmentId: string }>();
  const [sop, setSop] = useState<AssignmentSopRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchAssignmentSop(params.assignmentId);
        if (!cancelled) {
          setSop(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load SOP",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.assignmentId]);

  async function handleConfirm() {
    if (!sop) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmAcknowledgement(params.assignmentId, sop.processVersionId);
      window.location.href = "/my-acknowledgements";
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Unable to confirm acknowledgement",
      );
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-text-muted">Loading SOP…</p>;
  }

  if (error && !sop) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!sop) {
    return null;
  }

  return (
    <>
      <PageHeader
        title={sop.processName}
        description={`Read-only · Version ${sop.versionNumber ?? "—"}${
          sop.effectiveDate ? ` · Effective ${sop.effectiveDate}` : ""
        }`}
      />

      <div className="mb-4">
        <Link href="/my-acknowledgements" className="text-sm text-brand-teal hover:underline">
          ← Back to My Acknowledgements
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 text-sm" data-testid="ack-sop-read-view">
        <ol className="list-decimal space-y-4 pl-5">
          {sop.steps.map((step) => {
            const number = step.step_number ?? step.stepNumber;
            return (
              <li key={step.id}>
                <p className="font-medium text-slate-900">
                  {number ? `${number}. ` : ""}
                  {step.title}
                </p>
                {step.description ? (
                  <p className="mt-1 text-text-muted">{step.description}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <PrimaryButton
          disabled={busy}
          data-testid="ack-confirm-button"
          onClick={() => void handleConfirm()}
        >
          {busy ? "Confirming…" : "Confirm acknowledgement"}
        </PrimaryButton>
      </div>
    </>
  );
}
