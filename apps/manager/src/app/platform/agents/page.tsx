import { PlatformShell } from "@/components/platform-shell";
import { aquilensInternalFetch } from "@/lib/aquilens-api";

export const dynamic = "force-dynamic";

export default async function PlatformAgentsPage() {
  let agents: Array<{ agentKey: string; displayName: string; mtdCalls?: number }> = [];
  let error: string | null = null;

  try {
    const data = await aquilensInternalFetch<{ items: typeof agents }>(
      "/api/internal/platform-agents",
    );
    agents = data.items ?? [];
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load agents";
  }

  return (
    <PlatformShell>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-brand-navy">Platform AI agents</h2>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {agents.map((agent) => (
            <article
              key={agent.agentKey}
              className="rounded-md border border-border bg-white p-4"
            >
              <h3 className="font-medium">{agent.displayName}</h3>
              <p className="mt-1 text-xs text-text-muted">{agent.agentKey}</p>
              <p className="mt-2 text-sm">MTD calls: {agent.mtdCalls ?? 0}</p>
            </article>
          ))}
        </div>
      </div>
    </PlatformShell>
  );
}
