"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import { type ProcessListItem } from "@/lib/processes";

export default function StartWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProcessId = searchParams.get("processId") ?? "";

  const [processes, setProcesses] = useState<ProcessListItem[]>([]);
  const [processId, setProcessId] = useState(preselectedProcessId);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<ProcessListItem[]>("/processes?status=active");
        if (!cancelled) {
          setProcesses(data);
          if (preselectedProcessId) {
            const selected = data.find((item) => item.id === preselectedProcessId);
            if (selected) {
              setTitle(selected.name);
            }
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load processes",
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
  }, [preselectedProcessId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!processId || !title.trim()) {
      setError("Select a process and enter a record title.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<{ id: string }>("/workflows", {
        method: "POST",
        body: JSON.stringify({
          processId,
          title: title.trim(),
          context: context.trim() || undefined,
        }),
      });
      router.push(`/workflows/${data.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to log compliance record");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Log Compliance Record"
        description="Create an optional audit or compliance log from an active SOP with step evidence."
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Loading…
        </div>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="max-w-2xl space-y-4 rounded-lg border border-border bg-white p-6"
        >
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-900">Process</span>
            <select
              value={processId}
              onChange={(event) => {
                const nextId = event.target.value;
                setProcessId(nextId);
                const selected = processes.find((item) => item.id === nextId);
                if (selected && !title.trim()) {
                  setTitle(selected.name);
                }
              }}
              className="w-full rounded-md border border-border px-3 py-2"
              required
            >
              <option value="">Select an active process…</option>
              {processes.map((process) => (
                <option key={process.id} value={process.id}>
                  {process.name}
                  {process.processCode ? ` (${process.processCode})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-900">Record title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-border px-3 py-2"
              placeholder="e.g. Enrol New Student — Term 2 2025"
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-900">Context (optional)</span>
            <textarea
              value={context}
              onChange={(event) => setContext(event.target.value)}
              className="min-h-24 w-full rounded-md border border-border px-3 py-2"
              placeholder="Additional context for participants"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <PrimaryButton disabled={busy} type="submit">
              {busy ? "Logging…" : "Log Compliance Record"}
            </PrimaryButton>
            <Link
              href={processId ? `/processes/${processId}` : "/workflows"}
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
