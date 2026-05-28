"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CardListSkeleton } from "@/components/list-table-skeleton";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import {
  acknowledgementStatusBadgeClass,
  confirmAcknowledgement,
  fetchMyAcknowledgements,
  type AcknowledgementAssignment,
} from "@/lib/acknowledgements";

export default function MyAcknowledgementsPage() {
  const [items, setItems] = useState<AcknowledgementAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const data = await fetchMyAcknowledgements();
    setItems(data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchMyAcknowledgements();
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load acknowledgements",
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

  async function handleConfirm(assignmentId: string, processVersionId: string) {
    setBusyId(assignmentId);
    setError(null);
    try {
      await confirmAcknowledgement(assignmentId, processVersionId);
      await reload();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Unable to confirm acknowledgement",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="My Acknowledgements"
        description="Read and confirm published SOPs assigned to you."
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6">
          <CardListSkeleton rows={4} />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-red-600">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title="Nothing pending"
          description="When a published SOP requires your acknowledgement, it will appear here."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-white p-4 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{item.processName}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Version {item.versionNumber ?? "—"}
                    {item.dueDate
                      ? ` · Due ${new Date(item.dueDate).toLocaleDateString()}`
                      : null}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs capitalize ${acknowledgementStatusBadgeClass(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/my-acknowledgements/${item.id}`}
                  className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  data-testid="ack-read-sop-link"
                >
                  Read SOP
                </Link>
                <PrimaryButton
                  disabled={busyId === item.id}
                  data-testid="ack-confirm-button"
                  onClick={() => void handleConfirm(item.id, item.processVersionId)}
                >
                  {busyId === item.id ? "Confirming…" : "Confirm acknowledgement"}
                </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
