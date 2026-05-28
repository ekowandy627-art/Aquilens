"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { EmptyState } from "@/components/empty-state";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import { apiFetch } from "@/lib/api-client";
import {
  attestationBadgeClass,
  type AgentListItem,
  riskBadgeClass,
} from "@/lib/agents";
import { getSessionContext } from "@/lib/demo-auth";

export default function AgentsPage() {
  const [items, setItems] = useState<AgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [attestationFilter, setAttestationFilter] = useState("");

  const permissions = getSessionContext().roles.flatMap((role) => role.permissions);
  const canRegister =
    permissions.includes("*") || permissions.includes("agents:create");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const params = new URLSearchParams();
        if (statusFilter) {
          params.set("status", statusFilter);
        }
        if (riskFilter) {
          params.set("risk", riskFilter);
        }
        if (attestationFilter) {
          params.set("attestationStatus", attestationFilter);
        }
        const query = params.toString();
        const data = await apiFetch<AgentListItem[]>(
          `/agents${query ? `?${query}` : ""}`,
        );
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load agents",
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
  }, [statusFilter, riskFilter, attestationFilter]);

  const filteredCount = useMemo(() => items.length, [items]);

  return (
    <>
      <PageHeader
        title="AI Agent Registry"
        description="Register models, track attestations, and link agents to SOP steps."
        action={
          canRegister ? (
            <Link href="/agents/new">
              <PrimaryButton>Register Agent</PrimaryButton>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under review</option>
          <option value="deprecated">Deprecated</option>
          <option value="retired">Retired</option>
        </select>
        <select
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">All risk levels</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={attestationFilter}
          onChange={(event) => setAttestationFilter(event.target.value)}
          className="h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="">All attestation states</option>
          <option value="overdue">Overdue</option>
          <option value="due">Due soon</option>
          <option value="current">Current</option>
        </select>
      </div>

      {loading ? (
        <ListTableSkeleton rows={4} />
      ) : error ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : filteredCount === 0 ? (
        <EmptyState
          icon={Bot}
          title="No agents match your filters"
          description="Register a new agent or clear filters to see the registry."
          actionLabel={canRegister ? "Register agent" : undefined}
          actionHref={canRegister ? "/agents/new" : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Vendor / model</th>
                <th className="px-4 py-3">Function</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Attestation</th>
                <th className="px-4 py-3">Linked SOPs</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-text-muted">{item.agentCode}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {[item.vendor, item.modelName].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.owningFunctionName ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${riskBadgeClass(item.riskClassification)}`}
                    >
                      {item.riskClassification}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${attestationBadgeClass(item.attestationStatus)}`}
                    >
                      {item.attestationStatus === "overdue"
                        ? "Overdue"
                        : item.attestationStatus}
                    </span>
                    {item.nextAttestationDue ? (
                      <p className="mt-1 text-xs text-text-muted">
                        Due {new Date(item.nextAttestationDue).toLocaleDateString()}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {item.linkedProcessCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/agents/${item.agentCode}`}>
                      <PrimaryButton>View</PrimaryButton>
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
