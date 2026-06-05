"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetUnset, setBudgetUnset] = useState(true);
  const [savingBudget, setSavingBudget] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/platform/tenants/${tenantId}/metrics`);
      if (!response.ok) {
        throw new Error("Failed to load tenant metrics");
      }
      const data = (await response.json()) as TenantMetrics;
      setMetrics(data);
      if (data.aiBudgetUsd != null) {
        setBudgetUnset(false);
        setBudgetInput(String(data.aiBudgetUsd));
      } else {
        setBudgetUnset(true);
        setBudgetInput("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    }
  }, [tenantId]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  async function saveBudget() {
    setSavingBudget(true);
    setSaveMessage(null);
    setError(null);

    let aiMonthlyBudgetUsd: number | null;
    if (budgetUnset) {
      aiMonthlyBudgetUsd = null;
    } else {
      const parsed = Number(budgetInput);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError("Enter a valid non-negative budget amount, or choose unset.");
        setSavingBudget(false);
        return;
      }
      aiMonthlyBudgetUsd = parsed;
    }

    try {
      const response = await fetch(
        `/api/platform/tenants/${tenantId}/platform-config`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiMonthlyBudgetUsd }),
        },
      );

      if (response.status === 403) {
        throw new Error("Only super admins can update AI budget.");
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to save AI budget");
      }

      setSaveMessage(
        aiMonthlyBudgetUsd == null
          ? "AI budget cleared — tenant AI features are hard-blocked."
          : `AI budget set to $${aiMonthlyBudgetUsd.toFixed(2)}/month.`,
      );
      await loadMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingBudget(false);
    }
  }

  const budgetUsedPct = metrics?.percentOfBudget ?? metrics?.budgetUsedPct;

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
        {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}
        {metrics ? (
          <>
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
                    ? `$${metrics.aiBudgetUsd.toFixed(2)}/mo`
                    : "Not set"}
                </p>
              </div>
              <div className="rounded-md border border-border bg-white p-4">
                <p className="text-sm text-text-muted">Budget status</p>
                <p className="text-sm">
                  {metrics.aiBudgetUsd == null
                    ? "Hard-blocked (no budget configured)"
                    : metrics.overBudget
                      ? "Over budget"
                      : "Within budget"}
                  {budgetUsedPct != null ? ` (${budgetUsedPct}% used)` : ""}
                </p>
              </div>
            </div>

            <section className="rounded-md border border-border bg-white p-4 space-y-4">
              <div>
                <h3 className="font-medium text-brand-navy">AI budget configuration</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Monthly USD cap for tenant AI usage. Leave unset to hard-block compose,
                  gap analysis, and other AI features until a budget is assigned.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={budgetUnset}
                  onChange={(event) => {
                    setBudgetUnset(event.target.checked);
                    if (event.target.checked) {
                      setBudgetInput("");
                    }
                  }}
                />
                Unset budget (hard-block AI)
              </label>

              {!budgetUnset ? (
                <label className="block text-sm">
                  <span className="text-text-muted">Budget (USD / month)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={budgetInput}
                    onChange={(event) => setBudgetInput(event.target.value)}
                    className="mt-1 block w-full max-w-xs rounded-md border border-border px-3 py-2"
                    placeholder="e.g. 100"
                  />
                </label>
              ) : null}

              <button
                type="button"
                disabled={savingBudget}
                onClick={() => void saveBudget()}
                className="rounded-md bg-brand-teal px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingBudget ? "Saving…" : "Save AI budget"}
              </button>
            </section>

            <section className="rounded-md border border-border bg-surface-bg p-4 space-y-2">
              <h3 className="font-medium text-brand-navy">OpenAI API key</h3>
              <p className="text-sm text-text-muted">
                Per-tenant OpenAI keys are not supported in the current schema. The Aquilens
                API uses the platform-wide{" "}
                <code className="rounded bg-white px-1 py-0.5 text-xs">OPENAI_API_KEY</code>{" "}
                environment variable on the API server. Configure it in{" "}
                <code className="rounded bg-white px-1 py-0.5 text-xs">apps/api/.env</code>{" "}
                (see{" "}
                <code className="rounded bg-white px-1 py-0.5 text-xs">apps/api/.env.example</code>
                ). Adding per-tenant keys would require a new encrypted column and API routing
                changes.
              </p>
            </section>
          </>
        ) : null}
      </div>
    </PlatformShell>
  );
}
