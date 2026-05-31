"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";
import { useAuthContext } from "@/lib/use-auth-context";
import { canManageTenantScaffold } from "@/lib/scaffolds";
import {
  canCreateProcess,
  type ProcessListItem,
  riskBadgeClass,
  statusBadgeClass,
} from "@/lib/processes";

type TenantFunction = {
  id: string;
  name: string;
  description?: string;
  areas: Array<{ id: string; name: string }>;
};

export default function ProcessesPage() {
  const auth = useAuthContext();
  const permissions = auth.roles.flatMap((role) => role.permissions);
  const allowCreate = canCreateProcess(permissions);
  const allowManageStructure = canManageTenantScaffold(permissions);
  const isStaffOnly =
    auth.roles.some((role) => role.name === "Staff") &&
    !auth.roles.some((role) =>
      ["Super Admin", "Department Head", "Process Owner", "Compliance Officer"].includes(
        role.name,
      ),
    );

  const [processes, setProcesses] = useState<ProcessListItem[]>([]);
  const [functions, setFunctions] = useState<TenantFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [processData, profile] = await Promise.all([
          apiFetch<ProcessListItem[]>("/processes"),
          apiFetch<{ functions: TenantFunction[] }>("/tenants/profile"),
        ]);

        if (!cancelled) {
          setProcesses(processData);
          setFunctions(profile.functions ?? []);
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

  const filtered = useMemo(() => {
    return processes.filter((process) => {
      if (selectedFunctionId && process.functionId !== selectedFunctionId) {
        return false;
      }
      if (statusFilter && process.status !== statusFilter) {
        return false;
      }
      if (riskFilter && process.riskRating !== riskFilter) {
        return false;
      }
      return true;
    });
  }, [processes, selectedFunctionId, statusFilter, riskFilter]);

  const selectedFunction = useMemo(
    () => functions.find((fn) => fn.id === selectedFunctionId) ?? null,
    [functions, selectedFunctionId],
  );

  return (
    <>
      <PageHeader
        title={isStaffOnly ? "Procedures" : "Processes"}
        description={
          isStaffOnly
            ? "Read assigned SOPs and open step-by-step tutorials."
            : "Document, govern, review, and version each institutional process from one repository."
        }
        action={
          allowCreate ? (
            <Link href="/processes/new">
              <PrimaryButton>New Process</PrimaryButton>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {loading ? (
          <ListTableSkeleton showSidebar />
        ) : (
          <>
        <aside className="rounded-lg border border-border bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Functions
            </div>
            {allowManageStructure ? (
              <Link
                href="/settings/structure"
                className="text-xs font-medium text-brand-teal hover:underline"
              >
                Manage
              </Link>
            ) : null}
          </div>
          <div className="mt-3 space-y-1">
            <button
              type="button"
              onClick={() => setSelectedFunctionId(null)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedFunctionId === null
                  ? "bg-brand-teal/10 text-brand-teal"
                  : "hover:bg-surface-bg"
              }`}
            >
              All functions
            </button>
            {functions.map((fn) => (
              <button
                key={fn.id}
                type="button"
                onClick={() => setSelectedFunctionId(fn.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  selectedFunctionId === fn.id
                    ? "bg-brand-teal/10 text-brand-teal"
                    : "hover:bg-surface-bg"
                }`}
              >
                {fn.name}
              </button>
            ))}
          </div>
          {selectedFunction?.description ? (
            <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-text-muted">
              {selectedFunction.description}
            </p>
          ) : null}
        </aside>

        <section className="space-y-4">
          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-white p-4">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under review</option>
              <option value="active">Active</option>
            </select>
            <select
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value)}
              className="h-9 rounded-md border border-border bg-white px-3 text-sm"
            >
              <option value="">All risk levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No processes yet"
              description="Create your first SOP draft to start building your process repository."
              actionLabel={allowCreate ? "Create process" : undefined}
              actionHref={allowCreate ? "/processes/new" : undefined}
            />
          ) : (
            <div className="rounded-lg border border-border bg-white">
              <div className="grid grid-cols-12 gap-3 border-b border-border px-4 py-3 text-xs font-medium text-text-muted">
                <div className="col-span-5">Process</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Risk</div>
                <div className="col-span-3 text-right">Updated</div>
              </div>
              <div className="divide-y divide-border">
                {filtered.map((process) => (
                  <Link
                    key={process.id}
                    href={`/processes/${process.id}`}
                    className="grid grid-cols-12 gap-3 px-4 py-3 text-sm hover:bg-surface-bg"
                  >
                    <div className="col-span-5">
                      <div className="font-medium text-slate-950">{process.name}</div>
                      <div className="mt-1 text-xs text-text-muted">
                        {process.processCode ?? "Draft code pending"}
                        {process.functionName ? ` · ${process.functionName}` : ""}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass(process.status)}`}
                      >
                        {process.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${riskBadgeClass(process.riskRating)}`}
                      >
                        {process.riskRating}
                      </span>
                    </div>
                    <div className="col-span-3 text-right text-text-muted">
                      {new Date(process.updatedAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
          </>
        )}
      </div>
    </>
  );
}
