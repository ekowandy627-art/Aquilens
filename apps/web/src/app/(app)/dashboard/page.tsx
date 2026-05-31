"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { PrimaryButton } from "@/components/primary-button";
import { EmptyState } from "@/components/empty-state";
import {
  acknowledgementStatusBadgeClass,
  fetchDashboard,
  type DashboardSummary,
} from "@/lib/dashboard";
import { statusBadgeClass } from "@/lib/processes";
import { useAuthContext } from "@/lib/use-auth-context";

function AdminDashboard({ data }: { data: Extract<DashboardSummary, { roleView: "super_admin" }> }) {
  const cards = [
    { label: "Open compliance records", value: data.openWorkflows, icon: Activity, href: "/workflows" },
    {
      label: "Pending approvals",
      value: data.pendingApprovals,
      icon: ClipboardCheck,
      href: "/approvals",
    },
    {
      label: "Overdue items",
      value: data.overdueItems,
      icon: FileClock,
      href: "/workflows",
    },
    {
      label: "Agents needing attestation",
      value: data.agentsNeedingAttestation,
      icon: ShieldCheck,
      href: "/agents",
    },
  ];

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-md border border-border bg-white p-5 transition-colors hover:border-brand-teal"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-muted">{card.label}</p>
                <Icon className="size-4 text-brand-teal" aria-hidden="true" />
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-normal text-slate-950">
                {card.value}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="mt-6 rounded-md border border-border bg-white p-6">
        <h2 className="text-base font-semibold text-slate-950">Recent activity</h2>
        <ul className="mt-4 space-y-3">
          {data.recentActivity.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-slate-950">{item.action}</p>
                {item.entityName ? (
                  <p className="text-xs text-text-muted">{item.entityName}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-xs text-text-muted">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function StaffDashboard({ data }: { data: Extract<DashboardSummary, { roleView: "staff" }> }) {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border bg-white">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">Pending acknowledgements</h2>
          <p className="mt-1 text-sm text-text-muted">
            Read the procedure tutorial and confirm you understand the published version.
          </p>
        </div>

        {data.pendingAcknowledgements.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={BookOpenCheck}
              title="Nothing pending"
              description="When a new SOP version requires your acknowledgement, it will appear here."
            />
          </div>
        ) : (
          <ul>
            {data.pendingAcknowledgements.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 border-b border-border px-6 py-5 last:border-0 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-950">{item.processName}</p>
                  {item.dueDate ? (
                    <p className="mt-1 text-xs text-text-muted">
                      Due {new Date(item.dueDate).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${acknowledgementStatusBadgeClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                  <Link
                    href={`/processes/${item.processId}/tutorial?acknowledge=${item.id}`}
                  >
                    <PrimaryButton>Read &amp; confirm</PrimaryButton>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-border bg-white">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold text-slate-950">Your procedures</h2>
          <p className="mt-1 text-sm text-text-muted">
            SOPs assigned to you for reference — open the tutorial to follow step by step.
          </p>
        </div>

        {data.assignedProcesses.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="No procedures assigned"
              description="When you are listed on a process, it will appear here for reading."
            />
          </div>
        ) : (
          <ul>
            {data.assignedProcesses.map((process) => (
              <li
                key={process.id}
                className="flex flex-col gap-3 border-b border-border px-6 py-5 last:border-0 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-950">{process.name}</p>
                  {process.processCode ? (
                    <p className="mt-1 text-xs text-text-muted">{process.processCode}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${statusBadgeClass(process.status)}`}
                  >
                    {process.status.replace("_", " ")}
                  </span>
                  <Link href={`/processes/${process.id}/tutorial`}>
                    <PrimaryButton>Open tutorial</PrimaryButton>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DepartmentHeadDashboard({
  data,
}: {
  data: Extract<DashboardSummary, { roleView: "department_head" }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        {
          label: "Pending approvals",
          value: data.pendingApprovals,
          href: "/approvals",
        },
        {
          label: "Compliance records",
          value: data.departmentWorkflows,
          href: "/workflows",
        },
        { label: "Overdue items", value: data.overdueItems, href: "/workflows" },
      ].map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="rounded-md border border-border bg-white p-5 transition-colors hover:border-brand-teal"
        >
          <p className="text-sm font-medium text-text-muted">{card.label}</p>
          <p className="mt-5 text-3xl font-semibold text-slate-950">{card.value}</p>
        </Link>
      ))}
    </section>
  );
}

function ProcessOwnerDashboard({
  data,
}: {
  data: Extract<DashboardSummary, { roleView: "process_owner" }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "My drafts", value: data.myDraftProcesses },
        { label: "My pending approvals", value: data.myPendingApprovals },
        { label: "Active compliance records", value: data.myActiveWorkflows },
        { label: "My overdue tasks", value: data.myOverdueTasks },
      ].map((card) => (
        <article
          key={card.label}
          className="rounded-md border border-border bg-white p-5"
        >
          <p className="text-sm font-medium text-text-muted">{card.label}</p>
          <p className="mt-5 text-3xl font-semibold text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

function ComplianceDashboard({
  data,
}: {
  data: Extract<DashboardSummary, { roleView: "compliance_officer" }>;
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        { label: "Open incidents", value: data.openIncidents },
        { label: "Processes needing review", value: data.processesNeedingReview },
        { label: "Audit packs generated", value: data.auditPacksGenerated },
      ].map((card) => (
        <article
          key={card.label}
          className="rounded-md border border-border bg-white p-5"
        >
          <p className="text-sm font-medium text-text-muted">{card.label}</p>
          <p className="mt-5 text-3xl font-semibold text-slate-950">{card.value}</p>
        </article>
      ))}
    </section>
  );
}

export default function DashboardPage() {
  const context = useAuthContext();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = useMemo(
    () => context.roles.some((role) => role.name === "Staff"),
    [context.roles],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchDashboard();
        if (!cancelled) {
          setSummary(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load dashboard",
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
        title={isStaff ? "My Procedures" : "Operational Control Room"}
        description={
          isStaff
            ? "Read assigned SOPs, follow tutorials, and confirm acknowledgements when required."
            : "Action-first home for processes, approvals, evidence, and governance work that needs attention."
        }
        action={
          !isStaff ? (
            <Link href="/processes/new">
              <PrimaryButton>New Process</PrimaryButton>
            </Link>
          ) : undefined
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`dash-skel-${index}`}
              className="rounded-md border border-border bg-white p-5"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-4 h-3 w-full max-w-[12rem]" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : summary?.roleView === "staff" ? (
        <StaffDashboard data={summary} />
      ) : summary?.roleView === "department_head" ? (
        <DepartmentHeadDashboard data={summary} />
      ) : summary?.roleView === "process_owner" ? (
        <ProcessOwnerDashboard data={summary} />
      ) : summary?.roleView === "compliance_officer" ? (
        <ComplianceDashboard data={summary} />
      ) : summary?.roleView === "super_admin" ? (
        <AdminDashboard data={summary} />
      ) : (
        <EmptyState
          icon={Gauge}
          title="No dashboard data"
          description="Sign in to load your role-based dashboard."
          actionLabel="Go to login"
          actionHref="/login"
        />
      )}
    </>
  );
}
