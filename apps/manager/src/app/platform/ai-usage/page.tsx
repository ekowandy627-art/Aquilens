import { PlatformShell } from "@/components/platform-shell";
import { aquilensInternalFetch } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

export default async function PlatformAiUsagePage() {
  let overview: { mtdPlatformCostUsd?: number; tenantCount?: number } = {};
  let error: string | null = null;

  try {
    overview = await aquilensInternalFetch("/api/internal/metrics/overview");
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load AI usage";
  }

  return (
    <PlatformShell>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-navy">AI usage</h2>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="rounded-md border border-border bg-white p-4">
          <p className="text-sm text-text-muted">Platform MTD cost</p>
          <p className="mt-1 text-2xl font-semibold">
            ${(overview.mtdPlatformCostUsd ?? 0).toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Active tenants tracked: {overview.tenantCount ?? 0}
          </p>
        </div>
      </div>
    </PlatformShell>
  );
}
