"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import type { ApprovalListItem } from "@/app/(app)/approvals/page";
import type { ProcessDetail } from "@/lib/processes";
import { statusBadgeClass } from "@/lib/processes";

export default function ApprovalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalListItem | null>(null);
  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [comment, setComment] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const item = await apiFetch<ApprovalListItem>(`/approvals/${params.id}`);
      const detail = await apiFetch<ProcessDetail>(`/processes/${item.processId}`);
      if (!cancelled) {
        setApproval(item);
        setProcess(detail);
      }
    }
    void load().catch((loadError) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : "Not found");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/approvals/${params.id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comment: comment || undefined }),
      });
      router.push("/approvals");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!rejectComment.trim()) {
      setError("Rejection comment is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/approvals/${params.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ comment: rejectComment.trim() }),
      });
      router.push("/approvals");
      router.refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Reject failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={approval?.processName ?? "Approval"}
        description="Review this SOP before approving or rejecting."
        action={
          <Link href="/approvals" className="text-sm text-brand-teal hover:underline">
            Back to queue
          </Link>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!process ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Loading…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4 rounded-lg border border-border bg-white p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusBadgeClass(process.status)}`}
              >
                {process.status.replace("_", " ")}
              </span>
              {process.processCode ? (
                <span className="text-xs text-text-muted">{process.processCode}</span>
              ) : null}
            </div>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Overview</h2>
              <p className="mt-2 text-sm text-text-muted">
                {process.description ?? process.purpose ?? "No description."}
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Steps</h2>
              <ol className="mt-2 space-y-2">
                {process.steps.map((step) => (
                  <li
                    key={step.id}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">
                      {step.stepNumber}. {step.title}
                    </span>
                    {step.description ? (
                      <p className="mt-1 text-text-muted">{step.description}</p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-4 rounded-lg border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-slate-900">Decision</h2>
            <label className="block text-xs text-text-muted">
              Approval comment (optional)
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <PrimaryButton disabled={busy} onClick={() => void approve()}>
              Approve
            </PrimaryButton>

            {!showReject ? (
              <button
                type="button"
                onClick={() => setShowReject(true)}
                className="w-full rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                Reject…
              </button>
            ) : (
              <div className="space-y-2 border-t border-border pt-4">
                <label className="block text-xs text-text-muted">
                  Rejection comment (required)
                  <textarea
                    value={rejectComment}
                    onChange={(event) => setRejectComment(event.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void reject()}
                  className="w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm reject
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
