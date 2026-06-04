import { Inject, Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { AiUsageService } from "../platform-ops/ai-usage.service";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";
import { aiUsageDemoStore } from "../platform-ops/ai-usage-demo.store";
import { TenantPlatformConfigService } from "../platform-ops/tenant-platform-config.service";

const DEMO_TENANT_IDS = ["tenant-gis", "tenant-mfg", "tenant-hospital"];

export type TenantMetricsRow = {
  tenantId: string;
  name?: string;
  slug?: string;
  mtdCostUsd: number;
  aiBudgetUsd: number | null;
  budgetUsedPct: number | null;
  lifecycleState: string;
  overBudget: boolean;
};

@Injectable()
export class InternalMetricsService {
  constructor(
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
    @Inject(TenantPlatformConfigService)
    private readonly tenantPlatformConfig: TenantPlatformConfigService,
  ) {}

  async getOverview() {
    const tenants = await this.listTenantMetrics();
    return {
      mtdPlatformCostUsd: tenants.reduce((sum, row) => sum + row.mtdCostUsd, 0),
      tenantCount: tenants.length,
      tenantsOverBudget: tenants.filter((row) => row.overBudget).length,
      avgCacheHitRate: null,
      parseFailRate: null,
    };
  }

  async listTenantMetrics(): Promise<TenantMetricsRow[]> {
    if (usePlatformOpsDemoStore()) {
      return Promise.all(
        DEMO_TENANT_IDS.map((tenantId) => this.buildTenantMetrics(tenantId)),
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return [];
    }

    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name, slug");

    return Promise.all(
      (tenants ?? []).map((tenant) =>
        this.buildTenantMetrics(String(tenant.id), {
          name: String(tenant.name),
          slug: String(tenant.slug),
        }),
      ),
    );
  }

  async getTenantMetrics(tenantId: string) {
    return this.buildTenantMetrics(tenantId);
  }

  async getBenchmarks() {
    const tenants = await this.listTenantMetrics();
    const costs = tenants.map((row) => row.mtdCostUsd).toSorted((a, b) => a - b);
    const median =
      costs.length === 0 ? 0 : (costs[Math.floor(costs.length / 2)] ?? 0);

    return {
      tenantCount: tenants.length,
      medianMtdAiCostUsd: median,
      medianReadinessScore: null,
      medianAttestationRate: null,
    };
  }

  async listAiUsage(filters: {
    tenantId?: string;
    platformAgentKey?: string;
    limit?: number;
  }) {
    const limit = filters.limit ?? 50;

    if (usePlatformOpsDemoStore()) {
      let rows = filters.tenantId
        ? aiUsageDemoStore.listForTenant(filters.tenantId)
        : DEMO_TENANT_IDS.flatMap((id) => aiUsageDemoStore.listForTenant(id));
      if (filters.platformAgentKey) {
        rows = rows.filter(
          (row) => row.platformAgentKey === filters.platformAgentKey,
        );
      }
      return rows.slice(0, limit);
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return [];
    }

    let query = supabase
      .from("ai_usage_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters.tenantId) {
      query = query.eq("tenant_id", filters.tenantId);
    }
    if (filters.platformAgentKey) {
      query = query.eq("platform_agent_key", filters.platformAgentKey);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  private async buildTenantMetrics(
    tenantId: string,
    meta?: { name?: string; slug?: string },
  ): Promise<TenantMetricsRow> {
    const config = await this.tenantPlatformConfig.getConfig(tenantId);
    const mtdCostUsd = await this.aiUsage.getMtdCostUsd(tenantId);
    const aiBudgetUsd = config?.aiMonthlyBudgetUsd ?? null;
    const budgetUsedPct =
      aiBudgetUsd != null && aiBudgetUsd > 0
        ? Math.round((mtdCostUsd / aiBudgetUsd) * 1000) / 10
        : null;

    return {
      tenantId,
      name: meta?.name,
      slug: meta?.slug,
      mtdCostUsd,
      aiBudgetUsd,
      budgetUsedPct,
      lifecycleState: config?.lifecycleState ?? "active",
      overBudget: aiBudgetUsd != null ? mtdCostUsd >= aiBudgetUsd : false,
    };
  }
}
