"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ProcessStepBuilder,
  type DraftStep,
} from "@/components/processes/process-step-builder";
import { DetailPageSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import {
  type ProcessDetail,
  riskBadgeClass,
  roleLabel,
  statusBadgeClass,
} from "@/lib/processes";
import {
  formatExecutionSchedule,
  formatReviewFrequency,
} from "@/lib/execution-schedule";
import { AuditTrailTable } from "@/components/audit-trail-table";

const tabs = [
  "Overview",
  "Steps",
  "Governance",
  "People",
  "Version History",
  "Approval History",
  "Audit",
] as const;

type ProcessVersion = {
  id: string;
  versionNumber: number;
  status: string;
  changeSummary?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionComment?: string;
  isCurrent?: boolean;
};

type ApprovalSummary = {
  id: string;
  status: string;
  submittedBy?: string;
  submittedAt: string;
  decidedAt?: string;
  comment?: string;
  approverId?: string;
};

export default function ProcessDetailPage() {
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<ProcessDetail | null>(null);
  const [versions, setVersions] = useState<ProcessVersion[]>([]);
  const [approvals, setApprovals] = useState<ApprovalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("Overview");

  const allowEdit = data?.access.canEdit ?? false;
  const lifecycle = data?.lifecycle;

  async function reload() {
    const detail = await apiFetch<ProcessDetail>(`/processes/${params.id}`);
    setData(detail);
    if (activeTab === "Version History" || activeTab === "Approval History") {
      const [versionRows, approvalRows] = await Promise.all([
        apiFetch<ProcessVersion[]>(`/processes/${params.id}/versions`),
        apiFetch<ApprovalSummary[]>(`/processes/${params.id}/approvals`),
      ]);
      setVersions(versionRows);
      setApprovals(approvalRows);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const detail = await apiFetch<ProcessDetail>(`/processes/${params.id}`);
        if (!cancelled) {
          setData(detail);
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
  }, [params.id]);

  useEffect(() => {
    if (
      activeTab !== "Version History" &&
      activeTab !== "Approval History"
    ) {
      return;
    }
    void Promise.all([
      apiFetch<ProcessVersion[]>(`/processes/${params.id}/versions`),
      apiFetch<ApprovalSummary[]>(`/processes/${params.id}/approvals`),
    ]).then(([versionRows, approvalRows]) => {
      setVersions(versionRows);
      setApprovals(approvalRows);
    });
  }, [activeTab, params.id]);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const stepDrafts: DraftStep[] =
    data?.steps.map((step) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      responsibleRole: step.responsibleRole,
      stepType: step.stepType,
      evidenceRequired: step.evidenceRequired,
      agents: step.agents,
    })) ?? [];

  return (
    <>
      <PageHeader
        title={data?.name ?? "Process"}
        description={
          data?.processCode
            ? `${data.processCode}${data.functionName ? ` · ${data.functionName}` : ""}`
            : "Process details"
        }
        action={
          allowEdit ? (
            <Link href={`/processes/${params.id}/edit`}>
              <PrimaryButton>Edit</PrimaryButton>
            </Link>
          ) : lifecycle?.canCreateVersion ? (
            <PrimaryButton
              disabled={busy}
              onClick={() =>
                void runAction(async () => {
                  await apiFetch(`/processes/${params.id}/versions`, {
                    method: "POST",
                  });
                })
              }
            >
              Create New Version
            </PrimaryButton>
          ) : undefined
        }
      />

      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          <DetailPageSkeleton />
        </div>
      ) : !data ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Not found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusBadgeClass(data.status)}`}
            >
              {data.status.replace("_", " ")}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${riskBadgeClass(data.riskRating)}`}
            >
              {data.riskRating} risk
            </span>
            <span className="text-xs text-text-muted">
              Updated {new Date(data.updatedAt).toLocaleString()}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  activeTab === tab
                    ? "bg-brand-teal text-white"
                    : "text-text-muted hover:bg-surface-bg"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-white p-6 text-sm">
            {activeTab === "Overview" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Purpose" value={data.purpose} />
                <DetailField label="Description" value={data.description} />
                <DetailField
                  label="How often is this process performed?"
                  value={formatExecutionSchedule(data.executionSchedule)}
                />
                <DetailField
                  label="How often should this SOP be reviewed?"
                  value={formatReviewFrequency(data.reviewFrequency)}
                />
                <DetailField
                  label="Who it affects"
                  value={data.whoItAffects.join(", ") || "—"}
                />
                <DetailField
                  label="Linked systems"
                  value={data.linkedSystems.join(", ") || "—"}
                />
                <DetailField label="Tags" value={data.tags.join(", ") || "—"} />
                <DetailField
                  label="Process area"
                  value={data.processAreaName ?? "—"}
                />
              </div>
            ) : null}

            {activeTab === "Steps" ? (
              <ProcessStepBuilder
                steps={stepDrafts}
                readOnly
                processId={data.id}
                versionId={data.currentVersion?.id}
                onChange={() => undefined}
              />
            ) : null}

            {activeTab === "Governance" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField
                  label="How often should this SOP be reviewed?"
                  value={formatReviewFrequency(data.reviewFrequency)}
                />
                <DetailField
                  label="How often is this process performed?"
                  value={formatExecutionSchedule(data.executionSchedule)}
                />
                <DetailField label="Risk notes" value={data.riskNotes} />
                <DetailField
                  label="Approval required"
                  value={data.approvalRequired ? "Yes" : "No"}
                />
                <DetailField
                  label="Regulatory reference"
                  value={data.regulatoryReference}
                />
              </div>
            ) : null}

            {activeTab === "People" ? (
              <div className="space-y-3">
                {data.people.length === 0 ? (
                  <div className="text-text-muted">No people assigned yet.</div>
                ) : (
                  data.people.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="capitalize">{roleLabel(person.role)}</span>
                      <span className="text-text-muted">
                        {person.userId ?? "Unassigned user"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === "Version History" ? (
              <div className="space-y-3">
                {versions.length === 0 ? (
                  <div className="rounded-md border border-border px-3 py-2">
                    <div className="font-medium">
                      v{data.currentVersion?.versionNumber ?? 1}
                    </div>
                    <div className="mt-1 text-xs capitalize text-text-muted">
                      {data.currentVersion?.status ?? data.status}
                      {data.currentVersion ? " · current" : ""}
                    </div>
                  </div>
                ) : (
                  versions.map((version) => (
                    <div
                      key={version.id}
                      className="rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">v{version.versionNumber}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass(version.status)}`}
                        >
                          {version.status}
                        </span>
                      </div>
                      {version.isCurrent ? (
                        <p className="mt-1 text-xs text-brand-teal">Current version</p>
                      ) : null}
                      {version.changeSummary ? (
                        <p className="mt-1 text-xs text-text-muted">
                          {version.changeSummary}
                        </p>
                      ) : null}
                      {version.rejectionComment ? (
                        <p className="mt-1 text-xs text-red-600">
                          Rejected: {version.rejectionComment}
                        </p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === "Approval History" ? (
              <div className="space-y-3">
                {approvals.length === 0 ? (
                  <p className="text-text-muted">No approval decisions yet.</p>
                ) : (
                  approvals.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-md border border-border px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="capitalize font-medium">{item.status}</span>
                        <span className="text-xs text-text-muted">
                          {new Date(item.submittedAt).toLocaleString()}
                        </span>
                      </div>
                      {item.comment ? (
                        <p className="mt-1 text-xs text-text-muted">{item.comment}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {activeTab === "Audit" ? (
              <AuditTrailTable
                showHeader={false}
                showFilters={false}
                showExport={false}
                filters={{ entityId: params.id, entityType: "Process" }}
              />
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {lifecycle?.canSubmit ? (
              <PrimaryButton
                disabled={busy}
                onClick={() =>
                  void runAction(async () => {
                    await apiFetch(`/processes/${params.id}/submit`, {
                      method: "POST",
                    });
                  })
                }
              >
                Submit for Approval
              </PrimaryButton>
            ) : null}
            {lifecycle?.canStartWorkflow ? (
              <Link href={`/workflows/new?processId=${params.id}`}>
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
                >
                  Start Workflow
                </button>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="Only active SOPs can start workflows"
                className="rounded-md border border-border px-3 py-2 text-sm text-text-muted"
              >
                Start Workflow
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-slate-950">
        {value?.trim() ? value : "—"}
      </div>
    </div>
  );
}
