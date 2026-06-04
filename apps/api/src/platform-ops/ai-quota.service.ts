import { Inject, Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { usePlatformOpsDemoStore } from "./platform-ops-env";
import { AiUsageService } from "./ai-usage.service";
import {
  FEATURE_FLAG_BY_AGENT,
  type WallErrorCode,
} from "./platform-ops.types";
import { PlatformBlockedException, wallMessage } from "./platform-error";
import { TenantPlatformConfigService } from "./tenant-platform-config.service";

@Injectable()
export class AiQuotaService {
  constructor(
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
    @Inject(TenantPlatformConfigService)
    private readonly tenantPlatformConfig: TenantPlatformConfigService,
  ) {}

  async assertWithinBudget(tenantId: string) {
    const config = await this.tenantPlatformConfig.getConfig(tenantId);
    if (!config) {
      throw new PlatformBlockedException(
        "AI_BUDGET_UNSET",
        wallMessage("AI_BUDGET_UNSET"),
      );
    }

    await this.assertTenantActive(config);

    if (config.aiMonthlyBudgetUsd == null) {
      throw new PlatformBlockedException(
        "AI_BUDGET_UNSET",
        wallMessage("AI_BUDGET_UNSET"),
      );
    }

    const mtd = await this.aiUsage.getMtdCostUsd(tenantId);
    if (mtd >= config.aiMonthlyBudgetUsd) {
      throw new PlatformBlockedException(
        "AI_BUDGET_EXCEEDED",
        wallMessage("AI_BUDGET_EXCEEDED"),
        429,
      );
    }
  }

  async assertFeatureEnabled(tenantId: string, featureKey: string) {
    const config = await this.tenantPlatformConfig.getConfig(tenantId);
    if (!config) {
      throw new PlatformBlockedException(
        "FEATURE_DISABLED",
        wallMessage("FEATURE_DISABLED"),
        403,
      );
    }

    await this.assertTenantActive(config);

    const enabled = config.featureFlags[featureKey];
    if (enabled === false) {
      throw new PlatformBlockedException(
        "FEATURE_DISABLED",
        wallMessage("FEATURE_DISABLED"),
        403,
      );
    }
  }

  async assertAgentAllowed(tenantId: string, agentKey: string) {
    await this.assertWithinBudget(tenantId);
    const flagKey = FEATURE_FLAG_BY_AGENT[agentKey];
    if (flagKey) {
      await this.assertFeatureEnabled(tenantId, flagKey);
    }
  }

  private async assertTenantActive(config: {
    lifecycleState: string;
    tenantId: string;
  }) {
    if (
      config.lifecycleState === "suspended" ||
      config.lifecycleState === "offboarding"
    ) {
      throw new PlatformBlockedException(
        "TENANT_SUSPENDED",
        wallMessage("TENANT_SUSPENDED"),
        403,
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase || usePlatformOpsDemoStore()) {
      return;
    }

    const { data } = await supabase
      .from("tenants")
      .select("status")
      .eq("id", config.tenantId)
      .maybeSingle<{ status: string }>();

    if (data?.status === "suspended") {
      throw new PlatformBlockedException(
        "TENANT_SUSPENDED",
        wallMessage("TENANT_SUSPENDED"),
        403,
      );
    }
  }

  getWallCode(error: unknown): WallErrorCode | null {
    if (!(error instanceof PlatformBlockedException)) {
      return null;
    }
    const response = error.getResponse() as {
      error?: { code?: string };
    };
    const code = response.error?.code;
    if (
      code === "AI_BUDGET_UNSET" ||
      code === "AI_BUDGET_EXCEEDED" ||
      code === "FEATURE_DISABLED" ||
      code === "TENANT_SUSPENDED"
    ) {
      return code;
    }
    return null;
  }
}
