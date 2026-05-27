"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AiBadge } from "@/components/processes/ai-badge";
import {
  defaultResolvedFields,
  GapPanel,
  hasBlockingGaps,
  resolveGapField,
  type GapItem,
} from "@/components/processes/gap-panel";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { PermissionGate } from "@/components/auth/permission-gate";
import { apiFetch } from "@/lib/api-client";
import { AI_SOP_REVIEW_STORAGE_KEY } from "@/lib/ai-sop-storage";

type GeneratedDraft = {
  name: string;
  description: string;
  purpose: string;
  risk_rating: "high" | "medium" | "low";
  risk_notes: string;
  who_it_affects: string[];
  governance_controls: Array<{
    name: string;
    type: string;
    owner: string;
  }>;
  steps: Array<{
    step_number: number;
    title: string;
    description: string;
    responsible_role: string;
    inputs: string;
    outputs: string;
    controls: string;
    step_type: "manual" | "approval";
    evidence_required: boolean;
  }>;
};

type ReviewPayload = {
  functionId: string;
  processAreaId: string;
  draft: GeneratedDraft;
  gaps: GapItem[];
};

export default function ReviewGeneratedSopPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<ReviewPayload | null>(null);
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [resolvedFields, setResolvedFields] = useState<Set<string>>(
    defaultResolvedFields(),
  );
  const [ownerUserId, setOwnerUserId] = useState("");
  const [users, setUsers] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [riskRating, setRiskRating] = useState<"high" | "medium" | "low">(
    "medium",
  );
  const [riskNotes, setRiskNotes] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(AI_SOP_REVIEW_STORAGE_KEY);
    if (!raw) {
      router.replace("/processes/generate");
      return;
    }

    const parsed = JSON.parse(raw) as ReviewPayload;
    setPayload(parsed);
    setName(parsed.draft.name);
    setDescription(parsed.draft.description);
    setPurpose(parsed.draft.purpose);
    setRiskRating(parsed.draft.risk_rating);
    setRiskNotes(parsed.draft.risk_notes);
    setAiFields(
      new Set([
        "name",
        "description",
        "purpose",
        "risk_rating",
        "risk_notes",
      ]),
    );

    void apiFetch<Array<{ id: string; full_name: string; email: string }>>(
      "/users",
    ).then(setUsers);
  }, [router]);

  const gaps = payload?.gaps ?? [];
  const blocked = useMemo(
    () => hasBlockingGaps(gaps, resolvedFields),
    [gaps, resolvedFields],
  );

  function markEdited(field: string) {
    setAiFields((current) => {
      const next = new Set(current);
      next.delete(field);
      return next;
    });
    if (field === "risk_rating") {
      setResolvedFields((current) => resolveGapField("risk_rating", current));
    }
  }

  async function onSave() {
    if (!payload || blocked) {
      return;
    }

    if (!ownerUserId) {
      setError("Assign a process owner before saving.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const created = await apiFetch<{ id: string }>("/processes", {
        method: "POST",
        body: JSON.stringify({
          functionId: payload.functionId,
          processAreaId: payload.processAreaId,
          name: name.trim(),
          description,
          purpose,
          riskRating,
          riskNotes,
          whoItAffects: payload.draft.who_it_affects,
          governanceControls: payload.draft.governance_controls,
          creationSource: "ai_generated",
        }),
      });

      const detail = await apiFetch<{
        currentVersion: { id: string } | null;
      }>(`/processes/${created.id}`);

      const versionId = detail.currentVersion?.id;
      if (versionId) {
        for (const step of payload.draft.steps) {
          await apiFetch(`/processes/${created.id}/versions/${versionId}/steps`, {
            method: "POST",
            body: JSON.stringify({
              title: step.title,
              description: step.description,
              responsibleRole: step.responsible_role,
              stepType: step.step_type,
              inputs: step.inputs,
              outputs: step.outputs,
              controls: step.controls,
              evidenceRequired: step.evidence_required,
              stepNumber: step.step_number,
            }),
          });
        }

        await apiFetch(`/processes/${created.id}/versions/${versionId}/people`, {
          method: "PUT",
          body: JSON.stringify({
            people: [{ userId: ownerUserId, role: "owner" }],
          }),
        });
      }

      sessionStorage.removeItem(AI_SOP_REVIEW_STORAGE_KEY);
      router.push(`/processes/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  if (!payload) {
    return (
      <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
        Loading AI draft…
      </div>
    );
  }

  return (
    <PermissionGate permission="processes:create">
      <>
        <PageHeader
          title="Review AI draft"
          description="Review every field before saving. Required gaps must be resolved."
          action={
            <PrimaryButton>
              <span
                title={blocked ? "Resolve required gaps first" : undefined}
                onClick={blocked || saving ? undefined : onSave}
              >
                {saving ? "Saving…" : "Save as Draft"}
              </span>
            </PrimaryButton>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4 rounded-lg border border-border bg-white p-6">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Field label="Title" ai={aiFields.has("name")}>
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  markEdited("name");
                }}
                className="h-10 w-full rounded-md border border-border px-3 text-sm"
              />
            </Field>

            <Field label="Description" ai={aiFields.has("description")}>
              <textarea
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value);
                  markEdited("description");
                }}
                className="min-h-[96px] w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Purpose" ai={aiFields.has("purpose")}>
              <textarea
                value={purpose}
                onChange={(event) => {
                  setPurpose(event.target.value);
                  markEdited("purpose");
                }}
                className="min-h-[96px] w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Risk rating" ai={aiFields.has("risk_rating")}>
                <select
                  value={riskRating}
                  onChange={(event) => {
                    setRiskRating(event.target.value as "high" | "medium" | "low");
                    markEdited("risk_rating");
                  }}
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </Field>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-slate-950">Process owner</span>
                <select
                  value={ownerUserId}
                  onChange={(event) => {
                    setOwnerUserId(event.target.value);
                    if (event.target.value) {
                      setResolvedFields((current) =>
                        resolveGapField("owner", current),
                      );
                    }
                  }}
                  className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm"
                >
                  <option value="">Select owner…</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Field label="Risk notes" ai={aiFields.has("risk_notes")}>
              <textarea
                value={riskNotes}
                onChange={(event) => {
                  setRiskNotes(event.target.value);
                  markEdited("risk_notes");
                }}
                className="min-h-[72px] w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </Field>

            <div>
              <h3 className="text-sm font-semibold text-slate-950">Steps</h3>
              <div className="mt-3 space-y-3">
                {payload.draft.steps.map((step) => (
                  <div
                    key={step.step_number}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <div className="font-medium">
                      {step.step_number}. {step.title}
                    </div>
                    <div className="mt-1 text-text-muted">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between border-t border-border pt-4">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-2 text-sm"
                onClick={() => {
                  if (
                    window.confirm("Discard this AI draft and return to generation?")
                  ) {
                    sessionStorage.removeItem(AI_SOP_REVIEW_STORAGE_KEY);
                    router.push("/processes/generate");
                  }
                }}
              >
                Discard
              </button>
              <button
                type="button"
                className="rounded-md bg-brand-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={blocked || saving}
                title={blocked ? "Resolve required gaps first" : undefined}
                onClick={blocked || saving ? undefined : onSave}
              >
                {saving ? "Saving…" : "Save as Draft"}
              </button>
            </div>
          </div>

          <GapPanel gaps={gaps} />
        </div>
      </>
    </PermissionGate>
  );
}

function Field({
  label,
  ai,
  children,
}: {
  label: string;
  ai?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="flex items-center gap-2 font-medium text-slate-950">
        {label}
        {ai ? <AiBadge /> : null}
      </span>
      {children}
    </label>
  );
}
