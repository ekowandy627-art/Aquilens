import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AiUsageService } from "../platform-ops/ai-usage.service";
import { TenantPlatformConfigService } from "../platform-ops/tenant-platform-config.service";

@Controller("api/v1/tenant")
@UseGuards(AuthGuard, PermissionGuard)
export class TenantAiUsageController {
  constructor(
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
    @Inject(TenantPlatformConfigService)
    private readonly platformConfig: TenantPlatformConfigService,
  ) {}

  @Get("ai-usage")
  @RequirePermission("settings", "edit")
  async getAiUsage(@CurrentUser() user: AuthUser) {
    const config = await this.platformConfig.getConfig(user.tenantId);
    const mtdCostUsd = await this.aiUsage.getMtdCostUsd(user.tenantId);
    const budgetUsd = config?.aiMonthlyBudgetUsd ?? null;
    const percentUsed =
      budgetUsd != null && budgetUsd > 0
        ? Math.round((mtdCostUsd / budgetUsd) * 1000) / 10
        : null;

    return {
      success: true,
      data: {
        mtdCostUsd,
        budgetUsd,
        percentUsed,
        blocked:
          budgetUsd == null || (budgetUsd != null && mtdCostUsd >= budgetUsd),
        lifecycleState: config?.lifecycleState ?? "active",
      },
    };
  }
}
