import { PlatformShell } from "@/components/platform-shell";
import { aquilensInternalFetch } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

export default async function PlatformAuditPage() {
  let items: Array<{ eventType: string; action: string; createdAt?: string }> = [];
  let error: string | null = null;

  try {
    const data = await aquilensInternalFetch<{ items: typeof items }>(
      "/api/internal/platform-audit?limit=50",
    );
    items = data.items ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load audit log";
  }

  return (
    <PlatformShell>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-navy">Platform audit</h2>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <ul className="divide-y divide-border rounded-md border border-border bg-white">
          {items.map((item, index) => (
            <li key={`${item.eventType}-${index}`} className="px-4 py-3 text-sm">
              <p className="font-medium">{item.eventType}</p>
              <p className="text-text-muted">{item.action}</p>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="px-4 py-6 text-sm text-text-muted">No audit events yet.</li>
          ) : null}
        </ul>
      </div>
    </PlatformShell>
  );
}
