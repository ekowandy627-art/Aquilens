"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProcessTutorial } from "@/components/processes/process-tutorial";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import {
  confirmAcknowledgement,
  fetchAssignmentSop,
  type AssignmentSopRead,
} from "@/lib/acknowledgements";
import type { ProcessDetail } from "@/lib/processes";

export default function ProcessTutorialPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const acknowledgeId = searchParams.get("acknowledge");

  const [assignmentSop, setAssignmentSop] = useState<AssignmentSopRead | null>(null);
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (acknowledgeId) {
          const data = await fetchAssignmentSop(acknowledgeId);
          if (!cancelled) {
            setAssignmentSop(data);
          }
          return;
        }

        const detail = await apiFetch<ProcessDetail>(`/processes/${params.id}`);
        if (!cancelled) {
          setProcess(detail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load tutorial",
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
  }, [acknowledgeId, params.id]);

  async function handleConfirm() {
    if (!assignmentSop || !acknowledgeId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await confirmAcknowledgement(acknowledgeId, assignmentSop.processVersionId);
      router.push("/my-acknowledgements");
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
    return <p className="text-sm text-text-muted">Loading tutorial…</p>;
  }

  if (error && !assignmentSop && !process) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  const steps = assignmentSop?.steps ?? process?.steps ?? [];
  const processName = assignmentSop?.processName ?? process?.name ?? "Procedure";
  const versionLabel = assignmentSop?.versionNumber
    ? String(assignmentSop.versionNumber)
    : process?.currentVersion?.versionNumber
      ? String(process.currentVersion.versionNumber)
      : undefined;
  const effectiveDate =
    assignmentSop?.effectiveDate ?? process?.currentVersion?.effectiveDate;
  const purpose = process?.purpose;

  return (
    <>
      <PageHeader
        title="Procedure tutorial"
        description={
          acknowledgeId
            ? "Read each step, then confirm you understand this published version."
            : "Step-by-step reference generated from the published SOP."
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        {acknowledgeId ? (
          <Link href="/my-acknowledgements" className="text-brand-teal hover:underline">
            ← Back to My Acknowledgements
          </Link>
        ) : (
          <Link href={`/processes/${params.id}`} className="text-brand-teal hover:underline">
            ← Back to process
          </Link>
        )}
      </div>

      <ProcessTutorial
        processName={processName}
        versionLabel={versionLabel}
        effectiveDate={effectiveDate}
        purpose={purpose}
        steps={steps}
      />

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {acknowledgeId ? (
        <div className="mt-6 flex gap-2">
          <PrimaryButton
            disabled={busy}
            data-testid="ack-confirm-button"
            onClick={() => void handleConfirm()}
          >
            {busy ? "Confirming…" : "Confirm acknowledgement"}
          </PrimaryButton>
        </div>
      ) : null}
    </>
  );
}
