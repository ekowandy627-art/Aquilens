"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { useApiData } from "@/lib/use-api-data";
import {
  type WorkflowListItem,
  workflowStatusBadgeClass,
} from "@/lib/workflows";

const tabs = ["Active", "Completed", "All"] as const;

export default function WorkflowsPage() {
  const { data: items, loading, error } = useApiData<WorkflowListItem[]>(
    "/workflows",
    { initialData: [] },
  );
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Active");

  const filtered = useMemo(() => {
    if (activeTab === "All") {
      return items;
    }
    const status = activeTab === "Active" ? "in_progress" : "completed";
    return items.filter((item) => item.status === status);
  }, [activeTab, items]);

  return (
    <>
      <PageHeader
        title="Workflows"
        description="Start and track process instances, task completion, approvals, and evidence capture."
        action={
          <Link href="/workflows/new">
            <PrimaryButton>Start Workflow</PrimaryButton>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
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

      {loading ? (
        <ListTableSkeleton rows={5} />
      ) : error ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No workflows yet"
          description="Workflow instances will appear after an active SOP is started by a process owner."
          actionLabel="Start workflow"
          actionHref="/workflows/new"
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Process</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started by</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Tasks</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.processName ?? "—"}
                    {item.processCode ? (
                      <p className="text-xs">{item.processCode}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${workflowStatusBadgeClass(item.status)}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{item.startedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(item.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.tasksCompleted}/{item.tasksTotal}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/workflows/${item.id}`}>
                      <PrimaryButton>Open</PrimaryButton>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
