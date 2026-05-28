"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { EmptyState } from "@/components/empty-state";
import { LegalDisclaimer } from "@/components/legal-disclaimer";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import {
  downloadAuditPackFile,
  fetchAuditPackDownload,
  fetchAuditPackStatus,
  fetchAuditPacks,
  generateAuditPack,
  type AuditPackSummary,
} from "@/lib/audit";

const scopeOptions = [
  { value: "function", label: "By Function" },
  { value: "process", label: "By Process" },
  { value: "date_range", label: "By Date Range" },
  { value: "incident", label: "By Incident" },
] as const;

const functionOptions = [
  { id: "fn-school-academics", label: "Academics" },
  { id: "fn-school-admissions", label: "Admissions" },
  { id: "fn-school-finance", label: "Finance" },
];

const processOptions = [
  { id: "proc-gis-attendance", label: "Record Student Attendance" },
  { id: "proc-gis-enrolment", label: "Enrol New Student" },
  { id: "proc-gis-fees", label: "Process Fee Payment" },
];

export default function AuditPacksPage() {
  const [packs, setPacks] = useState<AuditPackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<(typeof scopeOptions)[number]["value"]>("function");
  const [scopeId, setScopeId] = useState("fn-school-academics");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  async function reload() {
    const data = await fetchAuditPacks();
    setPacks(data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchAuditPacks();
        if (!cancelled) {
          setPacks(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load audit packs",
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

  useEffect(() => {
    if (!pendingJobId) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchAuditPackStatus(pendingJobId).then(async (status) => {
        if (status.status === "ready" || status.status === "failed") {
          setPendingJobId(null);
          await reload();
        }
      });
    }, 1500);

    return () => window.clearInterval(interval);
  }, [pendingJobId]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateAuditPack({
        scope,
        scopeId: scope === "date_range" ? undefined : scopeId,
        dateFrom: dateFrom ? `${dateFrom}T00:00:00.000Z` : undefined,
        dateTo: dateTo ? `${dateTo}T23:59:59.000Z` : undefined,
      });
      setPendingJobId(result.jobId);
      await reload();
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : "Generation failed",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(jobId: string) {
    try {
      const blob = await downloadAuditPackFile(jobId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `audit-pack-${jobId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      const info = await fetchAuditPackDownload(jobId);
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : `Download unavailable (${info.status})`,
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Audit Packs"
        description="Generate scoped PDF audit packs for standards alignment reviews and external auditors."
        action={
          <Link href="/audit">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-bg"
            >
              View audit trail
            </button>
          </Link>
        }
      />

      <LegalDisclaimer className="mb-6" />

      <div className="mb-6 grid gap-4 rounded-lg border border-border bg-white p-5 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs text-text-muted">Scope</span>
          <select
            className="w-full rounded-md border border-border px-2 py-1.5"
            value={scope}
            onChange={(event) =>
              setScope(event.target.value as (typeof scopeOptions)[number]["value"])
            }
          >
            {scopeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {scope === "function" ? (
          <label className="text-sm">
            <span className="mb-1 block text-xs text-text-muted">Function</span>
            <select
              className="w-full rounded-md border border-border px-2 py-1.5"
              value={scopeId}
              onChange={(event) => setScopeId(event.target.value)}
            >
              {functionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {scope === "process" ? (
          <label className="text-sm">
            <span className="mb-1 block text-xs text-text-muted">Process</span>
            <select
              className="w-full rounded-md border border-border px-2 py-1.5"
              value={scopeId}
              onChange={(event) => setScopeId(event.target.value)}
            >
              {processOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {scope === "date_range" ? (
          <>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-text-muted">From</span>
              <input
                type="date"
                className="w-full rounded-md border border-border px-2 py-1.5"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-text-muted">To</span>
              <input
                type="date"
                className="w-full rounded-md border border-border px-2 py-1.5"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
          </>
        ) : null}

        <div className="flex items-end">
          <PrimaryButton disabled={generating} onClick={() => void handleGenerate()}>
            {generating || pendingJobId ? "Generating…" : "Generate Pack"}
          </PrimaryButton>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          <ListTableSkeleton rows={4} />
        </div>
      ) : packs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No audit packs yet"
          description="Generate a scoped pack to produce a PDF with process records, approvals, evidence index, and audit events."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {packs.map((pack) => (
                <tr key={pack.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{pack.scopeLabel ?? pack.scope}</p>
                    {pack.dateFrom || pack.dateTo ? (
                      <p className="text-xs text-text-muted">
                        {pack.dateFrom?.slice(0, 10) ?? "—"} to{" "}
                        {pack.dateTo?.slice(0, 10) ?? "—"}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {new Date(pack.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={pack.status} jobId={pack.id} pendingJobId={pendingJobId} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {pack.status === "ready" ? (
                      <PrimaryButton onClick={() => void handleDownload(pack.id)}>
                        Download
                      </PrimaryButton>
                    ) : null}
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

function StatusBadge({
  status,
  jobId,
  pendingJobId,
}: {
  status: string;
  jobId: string;
  pendingJobId: string | null;
}) {
  const label =
    status === "pending" || jobId === pendingJobId ? "Generating…" : status;

  const className =
    status === "ready"
      ? "bg-emerald-50 text-emerald-700"
      : status === "failed"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${className}`}>
      {label}
    </span>
  );
}
