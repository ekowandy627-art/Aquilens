"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PlatformShell } from "@/components/platform-shell";

type TenantMetrics = {
  tenantId: string;
  name: string;
  slug: string;
  mtdCostUsd: number;
  aiBudgetUsd: number | null;
  percentOfBudget: number | null;
  budgetUsedPct?: number | null;
  overBudget: boolean;
};

export default function TenantDetailPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/platform/tenants/${tenantId}/metrics`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load tenant metrics");
        }
        return response.json() as Promise<TenantMetrics>;
      })
      .then(setMetrics)
      .catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [tenantId]);

  return (
    <PlatformShell>
      <div className="space-y-4">
        <Link href="/platform/tenants" className="text-sm text-brand-teal underline">
          ← Back to tenants
        </Link>
        <h2 className="text-xl font-semibold text-brand-navy">
          {metrics?.name ?? "Tenant detail"}
        </h2>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {metrics ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-sm text-text-muted">Slug</p>
              <p className="font-mono text-sm">{metrics.slug}</p>
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-sm text-text-muted">MTD AI cost</p>
              <p className="text-xl font-semibold">${metrics.mtdCostUsd.toFixed(2)}</p>
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-sm text-text-muted">AI budget</p>
              <p className="text-xl font-semibold">
                {metrics.aiBudgetUsd != null
                  ? `$${metrics.aiBudgetUsd.toFixed(2)}`
                  : "Not set"}
              </p>
            </div>
            <div className="rounded-md border border-border bg-white p-4">
              <p className="text-sm text-text-muted">Budget status</p>
              <p className="text-sm">
                {metrics.overBudget ? "Over budget" : "Within budget"}
                {metrics.percentOfBudget != null || metrics.budgetUsedPct != null
                  ? ` (${metrics.percentOfBudget ?? metrics.budgetUsedPct}% used)`
                  : ""}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </PlatformShell>
  );
}
