"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PermissionGate } from "@/components/auth/permission-gate";
import { ProcessEditor } from "@/components/processes/process-editor";
import { apiFetch } from "@/lib/api-client";
import type { ProcessDetail } from "@/lib/processes";

export default function EditProcessPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const detail = await apiFetch<ProcessDetail>(`/processes/${params.id}`);
        if (!cancelled) {
          setData(detail);
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
  }, [params.id]);

  return (
    <PermissionGate permission="processes:edit">
      {loading ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Loading process…
        </div>
      ) : !data ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          Process not found.
        </div>
      ) : !data.access.canEdit ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-text-muted">
          You have read-only access to this process.
        </div>
      ) : (
        <ProcessEditor mode="edit" processId={params.id} initial={data} />
      )}
    </PermissionGate>
  );
}
