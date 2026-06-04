"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProcessFlowView } from "@/components/processes/process-flow-view";
import { ProcessLifecycleSpine } from "@/components/processes/process-lifecycle-spine";
import {
  ProcessStepBuilder,
  type DraftStep,
} from "@/components/processes/process-step-builder";
import { emptyEvidenceMap } from "@aquilens/shared";
import { ProcessDocumentsPanel } from "@/components/processes/process-documents-panel";
import { PublishProcessDialog } from "@/components/processes/publish-process-dialog";
import { DetailPageSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import {
  type ProcessDetail,
  type ProcessVersionSummary,
  formatParticipants,
  riskBadgeClass,
  roleLabel,
  statusBadgeClass,
} from "@/lib/processes";
import {
  formatExecutionSchedule,
  formatReviewFrequency,
} from "@/lib/execution-schedule";
import { AuditTrailTable } from "@/components/audit-trail-table";

const allTabs = [
  "Overview",
  "Flow",
  "Steps",
  "Governance",
  "Control",
  "Documents",
  "People",
  "Version History",
  "Approval History",
  "Audit",
] as const;

type Tab = (typeof allTabs)[number];

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
  const tabs = allTabs;

  const [data, setData] = useState<ProcessDetail | null>(null);
  const [versions, setVersions] = useState<ProcessVersionSummary[]>([]);
  const [approvals, setApprovals] = useState<ApprovalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const allowEdit = data?.access.canEdit ?? false;
  const lifecycle = data?.lifecycle;

  async function reload() {
    const detail = await apiFetch<ProcessDetail>(`/processes/${params.id}`);
    setData(detail);
    if (activeTab === "Version History" || activeTab === "Approval History") {
      const [versionRows, approvalRows] = await Promise.all([
        apiFetch<ProcessVersionSummary[]>(`/processes/${params.id}/versions`),
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
      apiFetch<ProcessVersionSummary[]>(`/processes/${params.id}/versions`),
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
      isControlPoint: step.isControlPoint ?? step.evidenceRequired,
      evidenceRequired: step.evidenceRequired,
      evidenceMap: step.evidenceMap ?? emptyEvidenceMap(),
      agents: step.agents,
    })) ?? [];

  const versionStatusLabel =
    data?.currentVersion?.status === "active"
      ? "Active"
      : data?.currentVersion?.status?.replace("_", " ");

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
            {data.currentVersion ? (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusBadgeClass(data.currentVersion.status)}`}
              >
                Version {versionStatusLabel}
              </span>
            ) : null}
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${riskBadgeClass(data.riskRating)}`}
            >
              {data.riskRating} risk
            </span>
            {lifecycle?.reviewOverdue ? (
              <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700">
                Review overdue
              </span>
            ) : null}
            <span className="text-xs text-text-muted">
              Updated {new Date(data.updatedAt).toLocaleString()}
            </span>
          </div>

          {data.lifecycle?.spine?.length ? (
            <ProcessLifecycleSpine stages={data.lifecycle.spine} />
          ) : null}

          <div className="flex flex-wrap gap-2 border-b border-border pb-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                data-testid={`process-tab-${tab.toLowerCase().replace(/\s+/g, "-")}`}
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
                  label="Linked standards"
                  value={
                    data.linkedGuidance?.length
                      ? data.linkedGuidance
                          .map((link) => link.packName ?? link.packSlug ?? link.packId)
                          .join(", ")
                      : "—"
                  }
                />
                <DetailField
                  label="Process area"
                  value={data.processAreaName ?? "—"}
                />
                {data.currentVersion?.effectiveDate ? (
                  <DetailField
                    label="Effective date"
                    value={data.currentVersion.effectiveDate}
                  />
                ) : null}
                {data.currentVersion?.reviewDueDate ? (
                  <DetailField
                    label="Review due"
                    value={data.currentVersion.reviewDueDate}
                  />
                ) : null}
              </div>
            ) : null}

            {activeTab === "Flow" ? (
              <ProcessFlowView steps={data.steps} />
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

            {activeTab === "Control" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailField label="Trigger" value={data.triggerDescription} />
                <DetailField
                  label="Participants"
                  value={formatParticipants(data.participants)}
                />
                <DetailField label="Inputs" value={data.inputs} />
                <DetailField label="Outputs" value={data.outputs} />
                <DetailField label="Exceptions" value={data.exceptions} />
              </div>
            ) : null}

            {activeTab === "Documents" ? (
              <ProcessDocumentsPanel processId={data.id} canUpload={allowEdit} />
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
                  <VersionCard version={data.currentVersion} fallback />
                ) : (
                  versions.map((version) => (
                    <VersionCard key={version.id} version={version} />
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
                        <span className="font-medium capitalize">{item.status}</span>
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
            {data.status === "active" ? (
              <Link href={`/processes/${params.id}/tutorial`}>
                <button
                  type="button"
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
                >
                  View tutorial
                </button>
              </Link>
            ) : null}
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
            {lifecycle?.canPublish ? (
              <span data-testid="publish-sop-button">
                <PrimaryButton disabled={busy} onClick={() => setPublishOpen(true)}>
                  Publish
                </PrimaryButton>
              </span>
            ) : null}
            {lifecycle?.canStartWorkflow ? (
              <span
                className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-text-muted"
                title="Compliance records will be triggered automatically in a later sprint"
              >
                System-triggered workflows only
              </span>
            ) : null}
            {lifecycle?.canArchive ? (
              <button
                type="button"
                disabled={busy}
                data-testid="archive-sop-button"
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
                onClick={() => {
                  if (
                    window.confirm(
                      "Archive this SOP? It will remain readable but leave active lists.",
                    )
                  ) {
                    void runAction(async () => {
                      await apiFetch(`/processes/${params.id}/archive`, {
                        method: "POST",
                      });
                    });
                  }
                }}
              >
                Archive
              </button>
            ) : null}
          </div>
        </div>
      )}

      {data ? (
        <PublishProcessDialog
          open={publishOpen}
          processName={data.name}
          busy={busy}
          onClose={() => setPublishOpen(false)}
          onPublish={(input) =>
            void runAction(async () => {
              await apiFetch(`/processes/${params.id}/publish`, {
                method: "POST",
                body: JSON.stringify(input),
              });
              setPublishOpen(false);
            })
          }
        />
      ) : null}
    </>
  );
}

function VersionCard({
  version,
  fallback = false,
}: {
  version: ProcessVersionSummary | null;
  fallback?: boolean;
}) {
  if (!version) {
    return (
      <div className="rounded-md border border-border px-3 py-2 text-text-muted">
        No version data.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">v{version.versionNumber}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass(version.status)}`}
        >
          {version.status === "active" ? "Active" : version.status.replace("_", " ")}
        </span>
      </div>
      {version.isCurrent || fallback ? (
        <p className="mt-1 text-xs text-brand-teal">Current version</p>
      ) : null}
      {version.changeSummary ? (
        <p className="mt-1 text-xs text-text-muted">{version.changeSummary}</p>
      ) : null}
      {version.effectiveDate ? (
        <p className="mt-1 text-xs text-text-muted">
          Effective {version.effectiveDate}
        </p>
      ) : null}
      {version.reviewDueDate ? (
        <p className="mt-1 text-xs text-text-muted">
          Review due {version.reviewDueDate}
          {version.reviewOverdue ? " · overdue" : ""}
        </p>
      ) : null}
      {version.publishedAt ? (
        <p className="mt-1 text-xs text-text-muted">
          Went live {new Date(version.publishedAt).toLocaleString()}
        </p>
      ) : null}
    </div>
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
