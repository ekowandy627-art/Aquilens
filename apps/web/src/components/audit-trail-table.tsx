"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { EmptyState } from "@/components/empty-state";
import { ListTableSkeleton } from "@/components/list-table-skeleton";
import {
  downloadAuditCsv,
  entityTypeOptions,
  fetchAuditEvents,
  type AuditEvent,
  type AuditFilters,
} from "@/lib/audit";

const EMPTY_AUDIT_FILTERS: AuditFilters = {};

type AuditTrailTableProps = {
  filters?: AuditFilters;
  showFilters?: boolean;
  showExport?: boolean;
  showHeader?: boolean;
  title?: string;
  description?: string;
};

export function AuditTrailTable({
  filters: initialFilters = EMPTY_AUDIT_FILTERS,
  showFilters = true,
  showExport = true,
  showHeader = true,
  title = "Audit",
  description = "Immutable event history and export-ready evidence trails across the tenant.",
}: AuditTrailTableProps) {
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [exporting, setExporting] = useState(false);

  const entityType = initialFilters.entityType ?? filters.entityType;
  const entityId = initialFilters.entityId ?? filters.entityId;
  const actorId = initialFilters.actorId ?? filters.actorId;
  const eventType = initialFilters.eventType ?? filters.eventType;
  const dateFrom = initialFilters.dateFrom ?? filters.dateFrom;
  const dateTo = initialFilters.dateTo ?? filters.dateTo;
  const cursor = initialFilters.cursor ?? filters.cursor;

  const queryFilters = useMemo(
    () => ({
      entityType,
      entityId,
      actorId,
      eventType,
      dateFrom,
      dateTo,
      cursor,
    }),
    [entityType, entityId, actorId, eventType, dateFrom, dateTo, cursor],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAuditEvents(queryFilters);
        if (!cancelled) {
          setItems(data.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load audit events",
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
  }, [queryFilters]);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await downloadAuditCsv(queryFilters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "audit-export.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(
        exportError instanceof Error ? exportError.message : "CSV export failed",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {showHeader ? (
        <PageHeader
          title={title}
          description={description}
          action={
            showExport ? (
              <PrimaryButton disabled={exporting} onClick={() => void handleExport()}>
                {exporting ? "Exporting…" : "Export CSV"}
              </PrimaryButton>
            ) : undefined
          }
        />
      ) : null}

      {showFilters ? (
        <div className="mb-4 grid gap-3 rounded-lg border border-border bg-white p-4 md:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-text-muted">Entity type</span>
            <select
              className="w-full rounded-md border border-border px-2 py-1.5"
              value={filters.entityType ?? "All"}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  entityType:
                    event.target.value === "All" ? undefined : event.target.value,
                }))
              }
            >
              {entityTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-text-muted">Event type</span>
            <input
              className="w-full rounded-md border border-border px-2 py-1.5"
              placeholder="e.g. process.approved"
              value={filters.eventType ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  eventType: event.target.value || undefined,
                }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-text-muted">From</span>
            <input
              type="date"
              className="w-full rounded-md border border-border px-2 py-1.5"
              value={filters.dateFrom?.slice(0, 10) ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateFrom: event.target.value
                    ? `${event.target.value}T00:00:00.000Z`
                    : undefined,
                }))
              }
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-text-muted">To</span>
            <input
              type="date"
              className="w-full rounded-md border border-border px-2 py-1.5"
              value={filters.dateTo?.slice(0, 10) ?? ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dateTo: event.target.value
                    ? `${event.target.value}T23:59:59.000Z`
                    : undefined,
                }))
              }
            />
          </label>
        </div>
      ) : null}

      {loading ? (
        <ListTableSkeleton rows={8} showFilters={false} />
      ) : error ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit events yet"
          description="Audit entries will be written automatically when users create processes, submit approvals, complete tasks, and upload evidence."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-surface-bg text-left text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3" />
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const expanded = expandedId === item.id;
                return (
                  <Fragment key={item.id}>
                    <tr key={item.id} className="border-b border-border align-top">
                      <td className="px-2 py-3">
                        {(item.beforeState || item.afterState) && (
                          <button
                            type="button"
                            className="rounded p-1 text-text-muted hover:bg-surface-bg"
                            onClick={() => setExpandedId(expanded ? null : item.id)}
                            aria-label={expanded ? "Collapse row" : "Expand row"}
                          >
                            {expanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{item.actorName ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{item.eventType}</td>
                      <td className="px-4 py-3">
                        <div>{item.entityName ?? item.entityType}</div>
                        <div className="text-xs text-text-muted">{item.entityType}</div>
                      </td>
                      <td className="px-4 py-3">{item.action}</td>
                    </tr>
                    {expanded ? (
                      <tr key={`${item.id}-detail`} className="border-b border-border bg-surface-bg">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <StateBlock label="Before" value={item.beforeState} />
                            <StateBlock label="After" value={item.afterState} />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function StateBlock({
  label,
  value,
}: {
  label: string;
  value?: Record<string, unknown>;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-text-muted">{label}</div>
      <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-white p-2 text-xs">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
