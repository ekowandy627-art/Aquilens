"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import { type MyTaskItem, taskStatusBadgeClass, taskStatusLabel } from "@/lib/workflows";

export default function MyTasksPage() {
  const [items, setItems] = useState<MyTaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await apiFetch<MyTaskItem[]>("/workflows/my-tasks");
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load tasks",
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
  }, []);

  return (
    <>
      <PageHeader
        title="My Tasks"
        description="Tasks assigned to you across all active workflows."
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          <CardListSkeleton rows={5} />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No tasks assigned"
          description="When a workflow task is assigned to you, it will appear here."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-white p-4 text-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{item.workflowTitle}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${taskStatusBadgeClass(item.status)}`}
                >
                  {taskStatusLabel(item.status)}
                </span>
              </div>
              {item.slaDueAt ? (
                <p className="mt-2 text-xs text-text-muted">
                  Due {new Date(item.slaDueAt).toLocaleString()}
                </p>
              ) : null}
              <div className="mt-3">
                <Link href={`/workflows/${item.workflowId}`}>
                  <PrimaryButton>Open workflow</PrimaryButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
