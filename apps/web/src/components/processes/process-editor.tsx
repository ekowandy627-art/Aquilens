"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ProcessStepBuilder,
  type DraftStep,
} from "@/components/processes/process-step-builder";
import { ExecutionScheduleFields } from "@/components/processes/execution-schedule-fields";
import {
  buildPeoplePayload,
  ProcessPeoplePanel,
  type TenantUserOption,
} from "@/components/processes/process-people-panel";
import { AutosaveIndicator } from "@/components/autosave-indicator";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import {
  defaultExecutionSchedule,
  type ExecutionSchedule,
} from "@/lib/execution-schedule";
import type { ProcessDetail } from "@/lib/processes";
import { useAuthContext } from "@/lib/use-auth-context";

type TenantFunction = {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
};

const wizardSteps = [
  "Location",
  "Identity",
  "Governance",
  "Steps",
  "People",
] as const;

type ProcessEditorProps = {
  mode: "create" | "edit";
  processId?: string;
  initial?: ProcessDetail;
};

export function ProcessEditor({ mode, processId, initial }: ProcessEditorProps) {
  const router = useRouter();
  const auth = useAuthContext();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initial?.updatedAt ? new Date(initial.updatedAt) : null,
  );

  const [functions, setFunctions] = useState<TenantFunction[]>([]);
  const [tenantUsers, setTenantUsers] = useState<TenantUserOption[]>([]);
  const [loadingScaffold, setLoadingScaffold] = useState(true);

  const [functionId, setFunctionId] = useState(initial?.functionId ?? "");
  const [processAreaId, setProcessAreaId] = useState(initial?.processAreaId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [purpose, setPurpose] = useState(initial?.purpose ?? "");
  const [whoItAffects, setWhoItAffects] = useState(
    (initial?.whoItAffects ?? []).join(", "),
  );
  const [linkedSystems, setLinkedSystems] = useState(
    (initial?.linkedSystems ?? []).join(", "),
  );
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [riskRating, setRiskRating] = useState<"high" | "medium" | "low">(
    (initial?.riskRating as "high" | "medium" | "low") ?? "medium",
  );
  const [riskNotes, setRiskNotes] = useState(initial?.riskNotes ?? "");
  const [approvalRequired, setApprovalRequired] = useState(
    initial?.approvalRequired ?? false,
  );
  const [reviewFrequency, setReviewFrequency] = useState(
    initial?.reviewFrequency ?? "annually",
  );
  const [executionSchedule, setExecutionSchedule] = useState<ExecutionSchedule>(
    initial?.executionSchedule ?? defaultExecutionSchedule,
  );
  const [steps, setSteps] = useState<DraftStep[]>(
    initial?.steps.map((step) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      responsibleRole: step.responsibleRole,
      stepType: step.stepType,
      evidenceRequired: step.evidenceRequired,
      agents: step.agents,
    })) ?? [],
  );
  const [ownerUserId, setOwnerUserId] = useState(
    initial?.people.find((person) => person.role === "owner")?.userId ??
      auth.user?.id ??
      "",
  );
  const [editorUserIds, setEditorUserIds] = useState<string[]>(
    initial?.people
      .filter((person) => person.role === "editor")
      .map((person) => person.userId!)
      .filter(Boolean) ?? [],
  );
  const [viewerUserIds, setViewerUserIds] = useState<string[]>(
    initial?.people
      .filter((person) => person.role === "viewer")
      .map((person) => person.userId!)
      .filter(Boolean) ?? [],
  );

  const canManagePeople =
    mode === "create" || initial?.access.canManagePeople !== false;

  const areas = useMemo(() => {
    const fn = functions.find((candidate) => candidate.id === functionId);
    return fn?.areas ?? [];
  }, [functions, functionId]);

  const versionId = initial?.currentVersion?.id;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [profile, users] = await Promise.all([
          apiFetch<{ functions: TenantFunction[] }>("/tenants/profile"),
          apiFetch<Array<{ id: string; full_name: string; email: string }>>(
            "/users",
          ),
        ]);
        if (!cancelled) {
          setFunctions(profile.functions ?? []);
          setTenantUsers(
            users.map((user) => ({
              id: user.id,
              full_name: user.full_name,
              email: user.email,
            })),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingScaffold(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncStepsAndPeople = useCallback(async (targetProcessId: string) => {
    const detail = await apiFetch<ProcessDetail>(`/processes/${targetProcessId}`);
    const currentVersionId = detail.currentVersion?.id;
    if (!currentVersionId) {
      return;
    }

    const existingIds = new Set(detail.steps.map((step) => step.id));
    const nextStepIds: string[] = [];

    for (const step of steps) {
      if (step.id && existingIds.has(step.id)) {
        await apiFetch(
          `/processes/${targetProcessId}/versions/${currentVersionId}/steps/${step.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              title: step.title,
              description: step.description,
              responsibleRole: step.responsibleRole,
              stepType: step.stepType,
              evidenceRequired: step.evidenceRequired,
              stepNumber: step.stepNumber,
            }),
          },
        );
        nextStepIds.push(step.id);
        existingIds.delete(step.id);
      } else {
        const created = await apiFetch<{ id: string }>(
          `/processes/${targetProcessId}/versions/${currentVersionId}/steps`,
          {
            method: "POST",
            body: JSON.stringify({
              title: step.title,
              description: step.description,
              responsibleRole: step.responsibleRole,
              stepType: step.stepType,
              evidenceRequired: step.evidenceRequired,
              stepNumber: step.stepNumber,
            }),
          },
        );
        nextStepIds.push(created.id);
      }
    }

    for (const removedId of existingIds) {
      await apiFetch(
        `/processes/${targetProcessId}/versions/${currentVersionId}/steps/${removedId}`,
        { method: "DELETE" },
      );
    }

    if (nextStepIds.length > 0) {
      await apiFetch(
        `/processes/${targetProcessId}/versions/${currentVersionId}/steps/reorder`,
        {
          method: "POST",
          body: JSON.stringify({ orderedIds: nextStepIds }),
        },
      );
    }

    await apiFetch(
      `/processes/${targetProcessId}/versions/${currentVersionId}/people`,
      {
        method: "PUT",
        body: JSON.stringify({
          people: buildPeoplePayload(ownerUserId, editorUserIds, viewerUserIds),
        }),
      },
    );
  }, [steps, ownerUserId, editorUserIds, viewerUserIds]);

  const persistDraft = useCallback(async (targetProcessId: string, redirectAfterCreate: boolean) => {
    setError(null);
    setSaving(true);

    try {
      const payload = {
        functionId,
        processAreaId,
        name: name.trim(),
        description: description.trim() || undefined,
        purpose: purpose.trim() || undefined,
        whoItAffects: splitList(whoItAffects),
        linkedSystems: splitList(linkedSystems),
        tags: splitList(tags),
        riskRating,
        riskNotes: riskNotes.trim() || undefined,
        approvalRequired,
        reviewFrequency,
        executionSchedule,
      };

      if (mode === "create" && redirectAfterCreate) {
        const created = await apiFetch<{ id: string; processCode?: string }>(
          "/processes",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
        await syncStepsAndPeople(created.id);
        setLastSavedAt(new Date());
        router.push(`/processes/${created.id}`);
        return;
      }

      await apiFetch(`/processes/${targetProcessId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      await syncStepsAndPeople(targetProcessId);
      setLastSavedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save process.");
    } finally {
      setSaving(false);
    }
  }, [
    functionId,
    processAreaId,
    name,
    description,
    purpose,
    whoItAffects,
    linkedSystems,
    tags,
    riskRating,
    riskNotes,
    approvalRequired,
    reviewFrequency,
    executionSchedule,
    mode,
    router,
    syncStepsAndPeople,
  ]);

  useEffect(() => {
    if (mode !== "edit" || !processId) {
      return;
    }

    const timer = window.setTimeout(() => {
      void persistDraft(processId, false);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [
    mode,
    processId,
    functionId,
    processAreaId,
    name,
    description,
    purpose,
    whoItAffects,
    linkedSystems,
    tags,
    riskRating,
    riskNotes,
    approvalRequired,
    reviewFrequency,
    executionSchedule,
    steps,
    ownerUserId,
    editorUserIds,
    viewerUserIds,
    persistDraft,
  ]);

  async function onFinish() {
    if (!functionId || !processAreaId || !name.trim()) {
      setError("Select a function and process area, and enter a process name.");
      return;
    }

    if (mode === "create") {
      await persistDraft("", true);
      return;
    }

    if (processId) {
      await persistDraft(processId, false);
      router.push(`/processes/${processId}`);
    }
  }

  return (
    <>
      <PageHeader
        title={mode === "create" ? "New Process" : `Edit ${name || "Process"}`}
        description="Build a governed SOP draft with location, governance, steps, and ownership."
        action={
          <div className="flex items-center gap-3">
            {mode === "edit" ? (
              <AutosaveIndicator lastSavedAt={lastSavedAt} />
            ) : null}
            <PrimaryButton>
              <span onClick={saving ? undefined : onFinish}>
                {saving ? "Saving…" : mode === "create" ? "Create process" : "Save & close"}
              </span>
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {wizardSteps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveStep(index)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              activeStep === index
                ? "bg-brand-teal text-white"
                : "bg-white text-text-muted border border-border"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        {loadingScaffold ? (
          <div className="text-sm text-text-muted">Loading function tree…</div>
        ) : (
          <div className="grid gap-5">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {activeStep === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Function">
                  <select
                    value={functionId}
                    onChange={(event) => {
                      setFunctionId(event.target.value);
                      setProcessAreaId("");
                    }}
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  >
                    <option value="">Select…</option>
                    {functions.map((fn) => (
                      <option key={fn.id} value={fn.id}>
                        {fn.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Process area">
                  <select
                    value={processAreaId}
                    onChange={(event) => setProcessAreaId(event.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                    disabled={!functionId}
                  >
                    <option value="">
                      {functionId ? "Select…" : "Select a function first"}
                    </option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : null}

            {activeStep === 1 ? (
              <div className="grid gap-4">
                <Field label="Title">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-10 w-full rounded-md border border-border px-3 text-sm"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="min-h-[96px] w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Purpose">
                  <textarea
                    value={purpose}
                    onChange={(event) => setPurpose(event.target.value)}
                    className="min-h-[96px] w-full rounded-md border border-border px-3 py-2 text-sm"
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Who it affects (comma separated)">
                    <input
                      value={whoItAffects}
                      onChange={(event) => setWhoItAffects(event.target.value)}
                      className="h-10 w-full rounded-md border border-border px-3 text-sm"
                    />
                  </Field>
                  <Field label="Linked systems">
                    <input
                      value={linkedSystems}
                      onChange={(event) => setLinkedSystems(event.target.value)}
                      className="h-10 w-full rounded-md border border-border px-3 text-sm"
                    />
                  </Field>
                </div>
                <Field label="Tags">
                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    className="h-10 w-full rounded-md border border-border px-3 text-sm"
                  />
                </Field>
              </div>
            ) : null}

            {activeStep === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Risk rating">
                  <select
                    value={riskRating}
                    onChange={(event) =>
                      setRiskRating(event.target.value as "high" | "medium" | "low")
                    }
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </Field>
                <Field
                  label="How often should this SOP be reviewed?"
                  hint="Governance cadence — when the document itself must be reviewed for accuracy."
                >
                  <select
                    value={reviewFrequency}
                    onChange={(event) => setReviewFrequency(event.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="risk_based">Risk-based</option>
                  </select>
                </Field>
                <ExecutionScheduleFields
                  value={executionSchedule}
                  onChange={setExecutionSchedule}
                />
                <Field label="Risk notes">
                  <textarea
                    value={riskNotes}
                    onChange={(event) => setRiskNotes(event.target.value)}
                    className="min-h-[96px] w-full rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input
                    type="checkbox"
                    checked={approvalRequired}
                    onChange={(event) => setApprovalRequired(event.target.checked)}
                  />
                  Approval required before activation
                </label>
              </div>
            ) : null}

            {activeStep === 3 ? (
              <ProcessStepBuilder
                steps={steps}
                processId={processId}
                versionId={initial?.currentVersion?.id}
                onChange={setSteps}
              />
            ) : null}

            {activeStep === 4 ? (
              <ProcessPeoplePanel
                users={tenantUsers}
                ownerUserId={ownerUserId}
                editors={editorUserIds}
                viewers={viewerUserIds}
                readOnly={!canManagePeople}
                onOwnerChange={setOwnerUserId}
                onEditorsChange={setEditorUserIds}
                onViewersChange={setViewerUserIds}
              />
            ) : null}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
                disabled={activeStep === 0}
                onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
              >
                Back
              </button>
              <div className="flex gap-2">
                {activeStep < wizardSteps.length - 1 ? (
                  <button
                    type="button"
                    className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white"
                    onClick={() =>
                      setActiveStep((current) =>
                        Math.min(wizardSteps.length - 1, current + 1),
                      )
                    }
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    disabled={saving}
                    onClick={saving ? undefined : onFinish}
                  >
                    {saving ? "Saving…" : mode === "create" ? "Create process" : "Save & close"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {mode === "edit" && versionId ? (
        <p className="mt-3 text-xs text-text-muted">
          Editing version {initial?.currentVersion?.versionNumber ?? 1}. Submit for
          approval arrives in Phase 5.
        </p>
      ) : null}
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-slate-950">{label}</span>
      {hint ? <span className="text-xs text-text-muted">{hint}</span> : null}
      {children}
    </label>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
