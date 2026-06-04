import { Inject, Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { AiUsageService } from "../platform-ops/ai-usage.service";
import { PlatformAiAgentRegistryService } from "../platform-ops/platform-ai-agent-registry.service";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";
import { aiUsageDemoStore } from "../platform-ops/ai-usage-demo.store";

const AGENT_CATALOG = [
  "sop_generate",
  "sop_transcribe",
  "sop_compose_align",
  "standards_gap_analysis",
  "standards_update_watch",
  "training_questions",
];

@Injectable()
export class InternalPlatformAgentsService {
  constructor(
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
    @Inject(PlatformAiAgentRegistryService)
    private readonly registry: PlatformAiAgentRegistryService,
  ) {}

  async listAgents() {
    const agents = await Promise.all(
      AGENT_CATALOG.map(async (agentKey) => {
        const prompt = await this.registry.getPrompt(agentKey);
        const model = await this.registry.getDefaultModel(agentKey);
        const usage = this.getAgentUsageStats(agentKey);
        return {
          agentKey,
          displayName: agentKey.replace(/_/g, " "),
          model,
          promptVersion: prompt.version,
          mtdCalls: usage.mtdCalls,
          mtdProviderCostUsd: usage.mtdCost,
          status: "active",
        };
      }),
    );
    return agents;
  }

  async getAgent(agentKey: string) {
    const prompt = await this.registry.getPrompt(agentKey);
    const model = await this.registry.getDefaultModel(agentKey);
    const usage = this.getAgentUsageStats(agentKey);
    return {
      agentKey,
      model,
      prompt,
      usage,
    };
  }

  async getAgentUsage(agentKey: string) {
    const usage = this.getAgentUsageStats(agentKey);
    const byTenant = this.getUsageByTenant(agentKey);
    return { agentKey, ...usage, byTenant };
  }

  private getAgentUsageStats(agentKey: string) {
    if (usePlatformOpsDemoStore()) {
      const rows = ["tenant-gis", "tenant-mfg", "tenant-hospital"].flatMap((id) =>
        aiUsageDemoStore.listForTenant(id),
      );
      const filtered = rows.filter((row) => row.platformAgentKey === agentKey);
      const mtdCost = filtered.reduce((sum, row) => sum + row.providerCostUsd, 0);
      return { mtdCalls: filtered.length, mtdCost, successRate: 100 };
    }
    return { mtdCalls: 0, mtdCost: 0, successRate: null };
  }

  private getUsageByTenant(agentKey: string) {
    if (!usePlatformOpsDemoStore()) {
      return [];
    }
    return ["tenant-gis", "tenant-mfg", "tenant-hospital"].map((tenantId) => {
      const rows = aiUsageDemoStore
        .listForTenant(tenantId)
        .filter((row) => row.platformAgentKey === agentKey);
      return {
        tenantId,
        callCount: rows.length,
        mtdProviderCostUsd: rows.reduce((sum, row) => sum + row.providerCostUsd, 0),
        lastUsedAt: rows.at(-1)?.createdAt ?? null,
      };
    });
  }
}
