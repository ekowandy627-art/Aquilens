"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PrimaryButton } from "@/components/primary-button";
import { apiFetch } from "@/lib/api-client";

export default function ProcessesPage() {
  const [processes, setProcesses] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      riskRating: string;
      updatedAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiFetch<
          Array<{
            id: string;
            name: string;
            status: string;
            riskRating: string;
            updatedAt: string;
          }>
        >("/processes");

        if (!cancelled) {
          setProcesses(data);
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
        title="Processes"
        description="Document, govern, review, and version each institutional process from one repository."
        action={
          <Link href="/processes/new">
            <PrimaryButton>New Process</PrimaryButton>
          </Link>
        }
      />
      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Loading processes…
        </div>
      ) : processes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No processes yet"
          description="Create your first SOP draft to start building your process repository."
          actionLabel="Create process"
        />
      ) : (
        <div className="rounded-lg border border-border bg-white">
          <div className="grid grid-cols-12 gap-3 border-b border-border px-4 py-3 text-xs font-medium text-text-muted">
            <div className="col-span-6">Process</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Risk</div>
            <div className="col-span-2 text-right">Updated</div>
          </div>
          <div className="divide-y divide-border">
            {processes.map((process) => (
              <Link
                key={process.id}
                href={`/processes/${process.id}`}
                className="grid grid-cols-12 gap-3 px-4 py-3 text-sm hover:bg-surface-bg"
              >
                <div className="col-span-6 font-medium text-slate-950">
                  {process.name}
                </div>
                <div className="col-span-2 capitalize text-text-muted">
                  {process.status.replace("_", " ")}
                </div>
                <div className="col-span-2 capitalize text-text-muted">
                  {process.riskRating}
                </div>
                <div className="col-span-2 text-right text-text-muted">
                  {new Date(process.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
