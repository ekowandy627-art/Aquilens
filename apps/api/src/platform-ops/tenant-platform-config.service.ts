import { Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { usePlatformOpsDemoStore } from "./platform-ops-env";
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAG_BY_AGENT,
  type TenantPlatformConfigRecord,
} from "./platform-ops.types";
import {
  seedTenantPlatformConfigDemo,
  tenantPlatformConfigDemoStore,
} from "./tenant-platform-config-demo.store";

@Injectable()
export class TenantPlatformConfigService {
  async getConfig(tenantId: string): Promise<TenantPlatformConfigRecord | null> {
    const supabase = getSupabaseAdminClient();
    if (usePlatformOpsDemoStore()) {
      return tenantPlatformConfigDemoStore.ensureDefault(tenantId);
    }

    if (!supabase) {
      throw new Error("Supabase admin client is not configured");
    }

    const { data, error } = await supabase
      .from("tenant_platform_config")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return this.fromRow(data);
  }

  async upsertConfig(
    tenantId: string,
    patch: Partial<Omit<TenantPlatformConfigRecord, "tenantId">>,
  ) {
    const supabase = getSupabaseAdminClient();
    if (usePlatformOpsDemoStore()) {
      const existing = tenantPlatformConfigDemoStore.ensureDefault(tenantId);
      return tenantPlatformConfigDemoStore.upsert({
        ...existing,
        ...patch,
        tenantId,
        featureFlags: {
          ...existing.featureFlags,
          ...(patch.featureFlags ?? {}),
        },
        modelRouting: {
          ...existing.modelRouting,
          ...(patch.modelRouting ?? {}),
        },
      });
    }

    if (!supabase) {
      throw new Error("Supabase admin client is not configured");
    }

    const existing = (await this.getConfig(tenantId)) ?? {
      tenantId,
      lifecycleState: "active" as const,
      aiMonthlyBudgetUsd: null,
      markupMultiplier: null,
      featureFlags: { ...DEFAULT_FEATURE_FLAGS },
      modelRouting: {},
    };

    const merged: TenantPlatformConfigRecord = {
      ...existing,
      ...patch,
      tenantId,
      featureFlags: { ...existing.featureFlags, ...(patch.featureFlags ?? {}) },
      modelRouting: { ...existing.modelRouting, ...(patch.modelRouting ?? {}) },
    };

    const { error } = await supabase.from("tenant_platform_config").upsert({
      tenant_id: tenantId,
      lifecycle_state: merged.lifecycleState,
      ai_monthly_budget_usd: merged.aiMonthlyBudgetUsd,
      markup_multiplier: merged.markupMultiplier,
      feature_flags: merged.featureFlags,
      model_routing: merged.modelRouting,
      plan_label: merged.planLabel ?? null,
      notes: merged.notes ?? null,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return merged;
  }

  /** Test helper — seed demo tenant with budget for AI flows. */
  seedDemoTenant(tenantId: string, budgetUsd = 100) {
    return seedTenantPlatformConfigDemo(tenantId, {
      aiMonthlyBudgetUsd: budgetUsd,
    });
  }

  private fromRow(row: Record<string, unknown>): TenantPlatformConfigRecord {
    return {
      tenantId: String(row.tenant_id),
      lifecycleState: row.lifecycle_state as TenantPlatformConfigRecord["lifecycleState"],
      aiMonthlyBudgetUsd:
        row.ai_monthly_budget_usd == null
          ? null
          : Number(row.ai_monthly_budget_usd),
      markupMultiplier:
        row.markup_multiplier == null ? null : Number(row.markup_multiplier),
      featureFlags: {
        ...DEFAULT_FEATURE_FLAGS,
        ...((row.feature_flags as Record<string, boolean>) ?? {}),
      },
      modelRouting: (row.model_routing as Record<string, string>) ?? {},
      planLabel: row.plan_label ? String(row.plan_label) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
    };
  }
}
