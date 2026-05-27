"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { apiFetch } from "@/lib/api-client";

type ProcessDetail = {
  id: string;
  name: string;
  description?: string | null;
  purpose?: string | null;
  status: string;
  risk_rating?: string;
  review_frequency?: string;
  approval_required?: boolean;
  updated_at?: string;
};

export default function ProcessDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const detail = await apiFetch<ProcessDetail>(`/processes/${id}`);
        if (!cancelled) setData(detail);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <PageHeader
        title={data?.name ?? "Process"}
        description="Process details (Phase 3 scaffolding)."
      />

      <div className="rounded-lg border border-border bg-white p-6 text-sm">
        {loading ? (
          <div className="text-text-muted">Loading…</div>
        ) : !data ? (
          <div className="text-text-muted">Not found.</div>
        ) : (
          <div className="grid gap-4">
            <div>
              <div className="text-xs font-medium text-text-muted">Status</div>
              <div className="capitalize">{data.status?.replace("_", " ")}</div>
            </div>
            {data.purpose ? (
              <div>
                <div className="text-xs font-medium text-text-muted">Purpose</div>
                <div className="whitespace-pre-wrap">{data.purpose}</div>
              </div>
            ) : null}
            {data.updated_at ? (
              <div>
                <div className="text-xs font-medium text-text-muted">Updated</div>
                <div>{new Date(data.updated_at).toLocaleString()}</div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

