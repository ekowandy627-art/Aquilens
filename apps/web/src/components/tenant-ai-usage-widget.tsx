"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type AiUsage = {
  mtdCostUsd: number;
  budgetUsd: number | null;
  percentUsed: number | null;
  blocked: boolean;
};

export function TenantAiUsageWidget() {
  const [usage, setUsage] = useState<AiUsage | null>(null);

  useEffect(() => {
    void apiFetch<AiUsage>("/tenant/ai-usage")
      .then(setUsage)
      .catch(() => setUsage(null));
  }, []);

  if (!usage) {
    return null;
  }

  return (
    <section className="rounded-md border border-border bg-white p-4">
      <h3 className="text-sm font-medium text-brand-navy">AI usage (month to date)</h3>
      <p className="mt-2 text-2xl font-semibold">${usage.mtdCostUsd.toFixed(2)}</p>
      {usage.budgetUsd != null ? (
        <p className="mt-1 text-sm text-text-muted">
          Budget ${usage.budgetUsd.toFixed(2)}
          {usage.percentUsed != null ? ` · ${usage.percentUsed}% used` : ""}
        </p>
      ) : (
        <p className="mt-1 text-sm text-amber-700">
          No AI budget configured — compose and gap analysis are blocked.
        </p>
      )}
      {usage.blocked ? (
        <p className="mt-2 text-sm text-amber-700">AI usage is currently blocked.</p>
      ) : null}
    </section>
  );
}
