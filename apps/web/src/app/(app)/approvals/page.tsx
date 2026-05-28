"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Stamp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { EmptyState } from "@/components/empty-state";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import { apiFetch } from "@/lib/api-client";
import { statusBadgeClass } from "@/lib/processes";

export type ApprovalListItem = {
  id: string;
  processId: string;
  processName: string;
  processCode?: string;
  functionName?: string;
  processAreaName?: string;
  status: string;
  submittedBy?: string;
  submittedAt: string;
};

export async function fetchApprovals() {
  return apiFetch<ApprovalListItem[]>("/approvals");
}

export async function fetchApprovalCount() {
  return apiFetch<{ count: number }>("/approvals/count");
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchApprovals();
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load approvals",
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
        title="Approvals"
        description="SOPs waiting for your review and sign-off."
      />

      {loading ? (
        <ListTableSkeleton rows={4} />
      ) : error ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Stamp}
          title="No pending approvals"
          description="When a process owner submits a SOP for approval, it will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Process</th>
                <th className="px-4 py-3">Function</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{item.processName}</p>
                    {item.processCode ? (
                      <p className="text-xs text-text-muted">{item.processCode}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.functionName ?? "—"}
                    {item.processAreaName ? ` · ${item.processAreaName}` : ""}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(item.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusBadgeClass(item.status === "pending" ? "under_review" : item.status)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/approvals/${item.id}`}>
                      <PrimaryButton>Review</PrimaryButton>
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
