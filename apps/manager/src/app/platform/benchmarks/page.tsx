import { PlatformShell } from "@/components/platform-shell";
import { aquilensInternalFetch } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

export default async function PlatformBenchmarksPage() {
  let benchmarks: {
    tenantCount?: number;
    medianMtdAiCostUsd?: number;
    medianMtdAiCostPerActiveUser?: number;
  } = {};
  let error: string | null = null;

  try {
    benchmarks = await aquilensInternalFetch("/api/internal/metrics/benchmarks");
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load benchmarks";
  }

  return (
    <PlatformShell>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-navy">Benchmarks</h2>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-white p-4">
            <p className="text-sm text-text-muted">Tenants</p>
            <p className="mt-1 text-xl font-semibold">{benchmarks.tenantCount ?? 0}</p>
          </div>
          <div className="rounded-md border border-border bg-white p-4">
            <p className="text-sm text-text-muted">Median MTD AI cost</p>
            <p className="mt-1 text-xl font-semibold">
              ${(benchmarks.medianMtdAiCostUsd ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-md border border-border bg-white p-4">
            <p className="text-sm text-text-muted">Median cost / active user</p>
            <p className="mt-1 text-xl font-semibold">
              ${(benchmarks.medianMtdAiCostPerActiveUser ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
