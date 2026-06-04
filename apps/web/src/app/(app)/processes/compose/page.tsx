"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Mic, PenLine, Plus, Sparkles } from "lucide-react";
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
import {
  saveSopResolution,
  streamSopCompose,
  transcribeAudio,
  type ComposeArtifact,
  type ComposeStreamEvent,
} from "@/lib/sop-compose";

type TenantFunction = {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
};

type PackOption = {
  packId?: string;
  slug: string;
  name: string;
  summary?: string;
};

type ComposedStep = {
  step_number: number;
  title: string;
  description: string;
  responsible_role: string;
  evidence_required: boolean;
  provenance?: Array<{ artifactId: string; label: string }>;
};

type ComposeDecision = {
  field: string;
  options: string[];
  sourceArtifactIds: string[];
  message: string;
};

export default function ProcessComposePage() {
  const router = useRouter();
  const [functions, setFunctions] = useState<TenantFunction[]>([]);
  const [functionId, setFunctionId] = useState("");
  const [processAreaId, setProcessAreaId] = useState("");
  const [narrative, setNarrative] = useState("");
  const [roughStep, setRoughStep] = useState("");
  const [artifacts, setArtifacts] = useState<ComposeArtifact[]>([]);
  const [recommendedPacks, setRecommendedPacks] = useState<PackOption[]>([]);
  const [confirmedPackIds, setConfirmedPackIds] = useState<string[]>([]);
  const [standardsConfirmed, setStandardsConfirmed] = useState(false);
  const [steps, setSteps] = useState<ComposedStep[]>([]);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [decisions, setDecisions] = useState<ComposeDecision[]>([]);
  const [resolvedFields, setResolvedFields] = useState<Set<string>>(
    defaultResolvedFields(),
  );
  const [draftHash, setDraftHash] = useState<string | null>(null);
  const [completeDraft, setCompleteDraft] = useState<Record<string, unknown> | null>(
    null,
  );
  const [progress, setProgress] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerUserId, setOwnerUserId] = useState("");
  const [users, setUsers] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);

  const areas = useMemo(
    () => functions.find((fn) => fn.id === functionId)?.areas ?? [],
    [functions, functionId],
  );

  const blocked = useMemo(
    () => hasBlockingGaps(gaps, resolvedFields),
    [gaps, resolvedFields],
  );

  const canCompose =
    functionId &&
    processAreaId &&
    standardsConfirmed &&
    confirmedPackIds.length > 0 &&
    artifacts.length > 0;

  useEffect(() => {
    void Promise.all([
      apiFetch<{ functions: TenantFunction[] }>("/tenants/profile"),
      apiFetch<Array<{ id: string; full_name: string; email: string }>>("/users"),
    ]).then(([profile, userRows]) => {
      setFunctions(profile.functions ?? []);
      setUsers(userRows);
    });
  }, []);

  useEffect(() => {
    if (!functionId) {
      return;
    }
    void apiFetch<{
      recommended: Array<{ slug: string; name: string; summary?: string }>;
      tenantSelections: Array<{
        packId: string;
        packSlug?: string;
        packName?: string;
      }>;
    }>(`/sop/compose/suggestions?functionId=${encodeURIComponent(functionId)}`).then(
      (data) => {
        const packs: PackOption[] = [
          ...data.tenantSelections.map((row) => ({
            packId: row.packId,
            slug: row.packSlug ?? row.packId,
            name: row.packName ?? row.packSlug ?? row.packId,
          })),
          ...data.recommended.map((pack) => ({
            slug: pack.slug,
            name: pack.name,
            summary: pack.summary,
          })),
        ];
        const seen = new Set<string>();
        const unique = packs.filter((pack) => {
          const key = pack.packId ?? pack.slug;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
        setRecommendedPacks(unique);
        setConfirmedPackIds(
          unique
            .map((pack) => pack.packId ?? pack.slug)
            .slice(0, Math.min(3, unique.length)),
        );
      },
    );
  }, [functionId]);

  function addNarrativeArtifact() {
    if (!narrative.trim()) {
      return;
    }
    setArtifacts((current) => [
      ...current,
      {
        id: `text-${Date.now()}`,
        kind: "text",
        content: narrative.trim(),
        provenanceLabel: "Written description",
      },
    ]);
    setNarrative("");
  }

  function addRoughStepArtifact() {
    if (!roughStep.trim()) {
      return;
    }
    setArtifacts((current) => [
      ...current,
      {
        id: `rough-${Date.now()}`,
        kind: "rough_step",
        content: roughStep.trim(),
        provenanceLabel: "Rough step",
      },
    ]);
    setRoughStep("");
  }

  async function onFileUpload(file: File) {
    const text = await file.text().catch(() => "");
    setArtifacts((current) => [
      ...current,
      {
        id: `file-${Date.now()}`,
        kind: "file",
        content: text || `[Attached file: ${file.name}]`,
        filename: file.name,
        provenanceLabel: file.name,
      },
    ]);
  }

  async function toggleRecording() {
    if (recording && mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: "audio/webm" });
      setBusy(true);
      setError(null);
      try {
        const result = await transcribeAudio(blob);
        setArtifacts((current) => [
          ...current,
          {
            id: result.artifactId,
            kind: "transcript",
            content: result.transcript,
            provenanceLabel: "Voice recording",
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed");
      } finally {
        setBusy(false);
      }
    };
    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  }

  async function onCompose() {
    if (!canCompose) {
      setError("Select location, confirm standards, and add at least one source.");
      return;
    }

    setBusy(true);
    setError(null);
    setSteps([]);
    setGaps([]);
    setDecisions([]);
    setCompleteDraft(null);
    setProgress("Starting compose…");

    try {
      await streamSopCompose(
        {
          functionId,
          processAreaId,
          confirmedPackIds,
          artifacts,
        },
        (event: ComposeStreamEvent) => {
          if (event.type === "progress") {
            setProgress(event.message);
          }
          if (event.type === "step") {
            setSteps((current) => [...current, event.step]);
          }
          if (event.type === "gap") {
            setGaps((current) => [...current, event.gap as GapItem]);
          }
          if (event.type === "decision") {
            setDecisions((current) => [...current, event.decision]);
          }
          if (event.type === "complete") {
            setCompleteDraft(event.draft);
            setDraftHash(event.draftHash);
            setGaps((current) => [
              ...current,
              ...event.gaps,
              ...event.alignmentGaps,
            ] as GapItem[]);
            setProgress(null);
          }
          if (event.type === "error") {
            setError(event.message);
          }
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Compose failed");
      setProgress(null);
    } finally {
      setBusy(false);
    }
  }

  async function resolveDecision(decision: ComposeDecision, value: string) {
    await saveSopResolution({
      sourceArtifactId: decision.sourceArtifactIds[0] ?? "unknown",
      field: decision.field,
      chosenValue: value,
      draftHash: draftHash ?? undefined,
    });
    if (decision.field === "risk_rating") {
      setResolvedFields((current) => resolveGapField("risk_rating", current));
    }
    setDecisions((current) =>
      current.filter((row) => row.field !== decision.field),
    );
  }

  async function onSaveDraft() {
    if (!completeDraft || blocked || !ownerUserId) {
      setError(
        blocked
          ? "Resolve required gaps before saving."
          : "Assign a process owner before saving.",
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const draft = completeDraft as {
        name: string;
        description: string;
        purpose: string;
        risk_rating: string;
        risk_notes: string;
        who_it_affects: string[];
        governance_controls: unknown[];
      };

      const created = await apiFetch<{ id: string }>("/processes", {
        method: "POST",
        body: JSON.stringify({
          functionId,
          processAreaId,
          name: draft.name,
          description: draft.description,
          purpose: draft.purpose,
          riskRating: draft.risk_rating,
          riskNotes: draft.risk_notes,
          whoItAffects: draft.who_it_affects,
          governanceControls: draft.governance_controls,
          creationSource: "ai_generated",
        }),
      });

      const detail = await apiFetch<{
        currentVersion: { id: string } | null;
      }>(`/processes/${created.id}`);

      const versionId = detail.currentVersion?.id;
      if (versionId) {
        for (const step of steps) {
          await apiFetch(
            `/processes/${created.id}/versions/${versionId}/steps`,
            {
              method: "POST",
              body: JSON.stringify({
                title: step.title,
                description: step.description,
                responsibleRole: step.responsible_role,
                stepType: "manual",
                isControlPoint: step.evidence_required,
                evidenceMap: step.evidence_required
                  ? { mode: "acknowledgement" }
                  : {},
                stepNumber: step.step_number,
              }),
            },
          );
        }

        await apiFetch(`/processes/${created.id}/versions/${versionId}/people`, {
          method: "PUT",
          body: JSON.stringify({
            people: [{ userId: ownerUserId, role: "owner" }],
          }),
        });

        if (confirmedPackIds.length) {
          await apiFetch(`/processes/${created.id}/guidance`, {
            method: "PUT",
            body: JSON.stringify({
              links: confirmedPackIds.map((packId) => ({ packId })),
            }),
          });
        }
      }

      router.push(`/processes/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save draft");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PermissionGate permission="processes:create">
      <PageHeader
        title="Compose SOP"
        description="Add sources, confirm standards, then generate and align in one streamed pass."
        action={
          <Link href="/processes/new/manual">
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium">
              <PenLine className="size-4" />
              Manual wizard
            </span>
          </Link>
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-950">Location</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={functionId}
              onChange={(event) => {
                setFunctionId(event.target.value);
                setProcessAreaId("");
                setStandardsConfirmed(false);
              }}
              className="h-10 rounded-md border border-border px-3 text-sm"
              data-testid="compose-function"
            >
              <option value="">Function…</option>
              {functions.map((fn) => (
                <option key={fn.id} value={fn.id}>
                  {fn.name}
                </option>
              ))}
            </select>
            <select
              value={processAreaId}
              onChange={(event) => setProcessAreaId(event.target.value)}
              disabled={!functionId}
              className="h-10 rounded-md border border-border px-3 text-sm"
              data-testid="compose-area"
            >
              <option value="">Process area…</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <h2 className="text-sm font-semibold text-slate-950">
            Standards (confirm before compose)
          </h2>
          <div className="space-y-2" data-testid="compose-standards">
            {recommendedPacks.map((pack) => {
              const id = pack.packId ?? pack.slug;
              return (
                <label
                  key={id}
                  className="flex items-start gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={confirmedPackIds.includes(id)}
                    onChange={(event) => {
                      setConfirmedPackIds((current) =>
                        event.target.checked
                          ? [...current, id]
                          : current.filter((value) => value !== id),
                      );
                      setStandardsConfirmed(false);
                    }}
                  />
                  <span>
                    <span className="font-medium">{pack.name}</span>
                    {pack.summary ? (
                      <span className="block text-xs text-text-muted">
                        {pack.summary}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={standardsConfirmed}
              onChange={(event) => setStandardsConfirmed(event.target.checked)}
              data-testid="compose-standards-confirm"
            />
            I confirm these packs apply to this SOP
          </label>

          <h2 className="text-sm font-semibold text-slate-950">Sources</h2>
          <textarea
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            placeholder="Describe the process in plain language…"
            className="min-h-[96px] w-full rounded-md border border-border px-3 py-2 text-sm"
            data-testid="compose-narrative"
          />
          <button
            type="button"
            className="text-sm font-medium text-brand-teal"
            onClick={addNarrativeArtifact}
          >
            Add description
          </button>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <FileUp className="size-4" />
              Attach file
              <input
                type="file"
                className="hidden"
                accept=".txt,.md,.csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void onFileUpload(file);
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => void toggleRecording()}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                recording ? "border-red-300 bg-red-50 text-red-800" : "border-border"
              }`}
              data-testid="compose-record"
            >
              <Mic className="size-4" />
              {recording ? "Stop recording" : "Record voice"}
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={roughStep}
              onChange={(event) => setRoughStep(event.target.value)}
              placeholder="Rough step title…"
              className="h-10 flex-1 rounded-md border border-border px-3 text-sm"
            />
            <button
              type="button"
              onClick={addRoughStepArtifact}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {artifacts.length > 0 ? (
            <ul className="space-y-1 text-xs text-text-muted">
              {artifacts.map((artifact) => (
                <li key={artifact.id}>
                  {artifact.provenanceLabel ?? artifact.kind} —{" "}
                  {(artifact.content ?? "").slice(0, 60)}
                  …
                </li>
              ))}
            </ul>
          ) : null}

          <PrimaryButton
            disabled={!canCompose || busy}
            onClick={() => void onCompose()}
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4" />
              {busy ? "Composing…" : "Compose + align"}
            </span>
          </PrimaryButton>
          {progress ? (
            <p className="text-xs text-text-muted">{progress}</p>
          ) : null}
        </div>

        <div className="space-y-4 rounded-lg border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-950">Draft preview</h2>

          {decisions.map((decision) => (
            <div
              key={decision.field}
              className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm"
              data-testid={`compose-decision-${decision.field}`}
            >
              <p className="font-medium text-amber-900">{decision.message}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {decision.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-medium"
                    onClick={() => void resolveDecision(decision, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {steps.length === 0 ? (
            <p className="text-sm text-text-muted">
              Steps will stream here as the composer runs.
            </p>
          ) : (
            <ol className="space-y-3">
              {steps.map((step) => (
                <li
                  key={step.step_number}
                  className="rounded-md border border-border p-3"
                  data-testid={`compose-step-${step.step_number}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-text-muted">
                      Step {step.step_number}
                    </span>
                    <AiBadge />
                    {step.provenance?.[0] ? (
                      <span
                        className="rounded-full bg-surface-bg px-2 py-0.5 text-xs text-text-muted"
                        title={step.provenance[0].label}
                      >
                        Source: {step.provenance[0].label}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 font-medium">{step.title}</div>
                  <p className="text-sm text-slate-700">{step.description}</p>
                </li>
              ))}
            </ol>
          )}

          {gaps.length > 0 ? <GapPanel gaps={gaps} /> : null}

          {completeDraft ? (
            <div className="space-y-3 border-t border-border pt-4">
              <label className="grid gap-1 text-sm">
                Process owner
                <select
                  value={ownerUserId}
                  onChange={(event) => setOwnerUserId(event.target.value)}
                  className="h-10 rounded-md border border-border px-3"
                >
                  <option value="">Select owner…</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
              <PrimaryButton
                disabled={busy || blocked || !ownerUserId}
                onClick={() => void onSaveDraft()}
              >
                Save as draft process
              </PrimaryButton>
            </div>
          ) : null}
        </div>
      </div>
    </PermissionGate>
  );
}
