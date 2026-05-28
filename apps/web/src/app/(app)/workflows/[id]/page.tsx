"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DetailPageSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch, apiUpload } from "@/lib/api-client";
import {
  type EvidenceDownload,
  type WorkflowAuditEvent,
  type WorkflowDetail,
  type WorkflowEvidence,
  type WorkflowTask,
  formatFileSize,
  isTaskActionable,
  taskStatusBadgeClass,
  taskStatusLabel,
  workflowStatusBadgeClass,
} from "@/lib/workflows";

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<WorkflowDetail | null>(null);
  const [audit, setAudit] = useState<WorkflowAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [evidenceByTask, setEvidenceByTask] = useState<
    Record<string, WorkflowEvidence[]>
  >({});

  async function loadEvidenceForTasks(workflowId: string, taskIds: string[]) {
    const entries = await Promise.all(
      taskIds.map(async (taskId) => {
        const items = await apiFetch<WorkflowEvidence[]>(
          `/workflows/${workflowId}/tasks/${taskId}/evidence`,
        );
        return [taskId, items] as const;
      }),
    );
    setEvidenceByTask(Object.fromEntries(entries));
  }

  async function reload() {
    const [detail, auditEvents] = await Promise.all([
      apiFetch<WorkflowDetail>(`/workflows/${params.id}`),
      apiFetch<WorkflowAuditEvent[]>(`/workflows/${params.id}/audit`),
    ]);
    setData(detail);
    setAudit(auditEvents);
    await loadEvidenceForTasks(
      params.id,
      detail.tasks.map((task) => task.id),
    );
    if (!selectedTaskId) {
      const active =
        detail.tasks.find((task) => task.status === "in_progress") ??
        detail.tasks.find((task) => isTaskActionable(task.status));
      setSelectedTaskId(active?.id ?? detail.tasks[0]?.id ?? null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [detail, auditEvents] = await Promise.all([
          apiFetch<WorkflowDetail>(`/workflows/${params.id}`),
          apiFetch<WorkflowAuditEvent[]>(`/workflows/${params.id}/audit`),
        ]);
        if (!cancelled) {
          setData(detail);
          setAudit(auditEvents);
          const evidenceEntries = await Promise.all(
            detail.tasks.map(async (task) => {
              const items = await apiFetch<WorkflowEvidence[]>(
                `/workflows/${params.id}/tasks/${task.id}/evidence`,
              );
              return [task.id, items] as const;
            }),
          );
          setEvidenceByTask(Object.fromEntries(evidenceEntries));
          const active =
            detail.tasks.find((task) => task.status === "in_progress") ??
            detail.tasks.find((task) => isTaskActionable(task.status));
          setSelectedTaskId(active?.id ?? detail.tasks[0]?.id ?? null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load workflow",
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
  }, [params.id]);

  const selectedTask = useMemo(
    () => data?.tasks.find((task) => task.id === selectedTaskId) ?? null,
    [data, selectedTaskId],
  );

  const selectedEvidence = selectedTask
    ? (evidenceByTask[selectedTask.id] ?? [])
    : [];

  const evidenceBlocksCompletion =
    Boolean(selectedTask?.evidenceRequired) && selectedEvidence.length === 0;

  async function runTaskAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setNotes("");
      await reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function timelineIndicator(task: WorkflowTask) {
    if (task.status === "completed" || task.status === "approved") {
      return "✓";
    }
    if (task.status === "rejected") {
      return "✗";
    }
    if (task.status === "skipped") {
      return "↷";
    }
    if (task.status === "in_progress") {
      return "●";
    }
    return "○";
  }

  return (
    <>
      <PageHeader
        title={data?.title ?? "Workflow"}
        description={
          data?.processName
            ? `${data.processName}${data.processCode ? ` · ${data.processCode}` : ""}`
            : "Workflow instance"
        }
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <DetailPageSkeleton />
      ) : !data ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Not found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white p-4 text-sm">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${workflowStatusBadgeClass(data.status)}`}
            >
              {data.status.replace("_", " ")}
            </span>
            <span className="text-text-muted">
              Started by {data.startedBy ?? "—"} on{" "}
              {new Date(data.startedAt).toLocaleString()}
            </span>
            <span className="text-text-muted">
              Tasks {data.tasksCompleted}/{data.tasksTotal}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div className="rounded-lg border border-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Timeline</h2>
              <ol className="space-y-3">
                {data.tasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left text-sm ${
                        selectedTaskId === task.id
                          ? "border-brand-teal bg-brand-teal/5"
                          : "border-border hover:bg-surface-bg"
                      }`}
                    >
                      <span className="mt-0.5 w-4 shrink-0 text-center font-semibold">
                        {timelineIndicator(task)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-medium text-slate-900">
                          Step {task.stepNumber}: {task.title}
                        </span>
                        <span
                          className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${taskStatusBadgeClass(task.status)}`}
                        >
                          {taskStatusLabel(task.status)}
                        </span>
                        {task.assignedTo ? (
                          <p className="mt-1 text-xs text-text-muted">
                            Assigned to {task.assignedTo}
                          </p>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Active task</h2>
              {selectedTask ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{selectedTask.title}</p>
                    {selectedTask.description ? (
                      <p className="mt-1 text-text-muted">{selectedTask.description}</p>
                    ) : null}
                  </div>
                  <p className="text-text-muted">
                    Type: {selectedTask.stepType} · Status:{" "}
                    {taskStatusLabel(selectedTask.status)}
                  </p>
                  <EvidenceSection
                    workflowId={data.id}
                    task={selectedTask}
                    items={selectedEvidence}
                    onUploaded={reload}
                  />

                  {isTaskActionable(selectedTask.status) &&
                  data.status === "in_progress" ? (
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-text-muted">Notes</span>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="min-h-20 w-full rounded-md border border-border px-3 py-2"
                        placeholder="Optional notes"
                      />
                    </label>
                  ) : null}

                  <TaskActions
                    workflowId={data.id}
                    task={selectedTask}
                    workflowStatus={data.status}
                    busy={busy}
                    notes={notes}
                    completeDisabled={evidenceBlocksCompletion}
                    onAction={runTaskAction}
                  />
                </div>
              ) : (
                <p className="text-sm text-text-muted">Select a task from the timeline.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Workflow log</h2>
            {audit.length === 0 ? (
              <p className="text-sm text-text-muted">No events recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {audit.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{event.action}</span>
                      <span className="text-xs text-text-muted">
                        {new Date(event.occurredAt).toLocaleString()}
                      </span>
                    </div>
                    {event.actorName ? (
                      <p className="mt-1 text-xs text-text-muted">{event.actorName}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function EvidenceSection({
  workflowId,
  task,
  items,
  onUploaded,
}: {
  workflowId: string;
  task: WorkflowTask;
  items: WorkflowEvidence[];
  onUploaded: () => Promise<void>;
}) {
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadNotes.trim()) {
        formData.append("notes", uploadNotes.trim());
      }
      await apiUpload<WorkflowEvidence>(
        `/workflows/${workflowId}/tasks/${task.id}/evidence`,
        formData,
      );
      setUploadNotes("");
      await onUploaded();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openDownload(evidenceId: string) {
    const result = await apiFetch<EvidenceDownload>(
      `/evidence/${evidenceId}/download`,
    );
    window.open(result.signedUrl, "_blank", "noopener,noreferrer");
  }

  const showUploader = isTaskActionable(task.status);

  return (
    <div className="space-y-3 rounded-md border border-border bg-surface-bg/40 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Evidence
      </h3>

      {task.evidenceRequired && items.length === 0 ? (
        <p className="rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-900">
          Evidence required before you can complete this task
        </p>
      ) : null}

      {showUploader ? (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-white px-4 py-6 text-center text-xs text-text-muted hover:border-brand-teal">
          <span className="font-medium text-slate-800">
            Drag a file here, or click to upload
          </span>
          <span className="mt-1">PDF, Word, Excel, images, or video</span>
          <input
            type="file"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void uploadFile(file);
              }
              event.target.value = "";
            }}
          />
        </label>
      ) : null}

      {showUploader ? (
        <label className="block space-y-1 text-xs">
          <span className="font-medium text-text-muted">Notes (optional)</span>
          <input
            value={uploadNotes}
            onChange={(event) => setUploadNotes(event.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
            placeholder="Add context for this evidence"
          />
        </label>
      ) : null}

      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
      {uploading ? (
        <p className="text-xs text-text-muted">Uploading…</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border bg-white px-3 py-2 text-xs"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{item.filename}</p>
                  <p className="mt-1 text-text-muted">
                    {formatFileSize(item.fileSize)} · {item.fileType} ·{" "}
                    {new Date(item.uploadedAt).toLocaleString()}
                  </p>
                  <p className="text-text-muted">Uploaded by {item.uploadedBy}</p>
                  {item.notes ? (
                    <p className="mt-1 text-slate-700">{item.notes}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void openDownload(item.id)}
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium text-brand-teal hover:bg-brand-teal/5"
                >
                  View / Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-muted">No evidence uploaded yet.</p>
      )}

      <p className="text-[11px] text-text-muted">
        Evidence is permanently attached to this record and cannot be deleted.
      </p>
    </div>
  );
}

function TaskActions({
  workflowId,
  task,
  workflowStatus,
  busy,
  notes,
  completeDisabled,
  onAction,
}: {
  workflowId: string;
  task: WorkflowTask;
  workflowStatus: string;
  busy: boolean;
  notes: string;
  completeDisabled: boolean;
  onAction: (action: () => Promise<void>) => Promise<void>;
}) {
  if (workflowStatus !== "in_progress" || !isTaskActionable(task.status)) {
    return null;
  }

  if (task.stepType === "approval") {
    return (
      <div className="flex flex-wrap gap-2">
        <PrimaryButton
          disabled={busy}
          onClick={() =>
            void onAction(async () => {
              await apiFetch(`/workflows/${workflowId}/tasks/${task.id}/approve`, {
                method: "POST",
                body: JSON.stringify({ notes: notes || undefined }),
              });
            })
          }
        >
          Approve
        </PrimaryButton>
        <button
          type="button"
          disabled={busy || !notes.trim()}
          onClick={() =>
            void onAction(async () => {
              await apiFetch(`/workflows/${workflowId}/tasks/${task.id}/reject`, {
                method: "POST",
                body: JSON.stringify({ comment: notes.trim() }),
              });
            })
          }
          className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {task.status === "pending" ? (
        <PrimaryButton
          disabled={busy}
          onClick={() =>
            void onAction(async () => {
              await apiFetch(`/workflows/${workflowId}/tasks/${task.id}/start`, {
                method: "POST",
              });
            })
          }
        >
          Start Task
        </PrimaryButton>
      ) : null}
      {task.status === "in_progress" || task.status === "pending" ? (
        <PrimaryButton
          disabled={busy || completeDisabled}
          onClick={() =>
            void onAction(async () => {
              await apiFetch(`/workflows/${workflowId}/tasks/${task.id}/complete`, {
                method: "POST",
                body: JSON.stringify({ notes: notes || undefined }),
              });
            })
          }
        >
          Complete Task
        </PrimaryButton>
      ) : null}
    </div>
  );
}
