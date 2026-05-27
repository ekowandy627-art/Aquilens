"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ProcessStepBuilder,
  type DraftStep,
} from "@/components/processes/process-step-builder";
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

const tabs = ["Overview", "Steps", "Governance", "People", "Version History"] as const;

export default function ProcessDetailPage() {
  const params = useParams<{ id: string }>();

  const [data, setData] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]>("Overview");

  const allowEdit = data?.access.canEdit ?? false;

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

  const stepDrafts: DraftStep[] =
    data?.steps.map((step) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      responsibleRole: step.responsibleRole,
      stepType: step.stepType,
      evidenceRequired: step.evidenceRequired,
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
          ) : undefined
        }
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Loading…
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
                <div className="rounded-md border border-border px-3 py-2">
                  <div className="font-medium">
                    v{data.currentVersion?.versionNumber ?? 1}
                  </div>
                  <div className="mt-1 text-xs capitalize text-text-muted">
                    {data.currentVersion?.status ?? data.status}
                  </div>
                </div>
                <p className="text-xs text-text-muted">
                  Additional versions and approval history arrive in Phase 5.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded-md border border-border px-3 py-2 text-sm text-text-muted"
            >
              Submit for Approval (Phase 5)
            </button>
            <button
              type="button"
              disabled
              className="rounded-md border border-border px-3 py-2 text-sm text-text-muted"
            >
              Start Workflow (Phase 6)
            </button>
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
