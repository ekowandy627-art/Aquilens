import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { AiQuotaService } from "../src/platform-ops/ai-quota.service";
import { AiUsageService } from "../src/platform-ops/ai-usage.service";
import { PlatformBlockedException } from "../src/platform-ops/platform-error";
import { TenantPlatformConfigService } from "../src/platform-ops/tenant-platform-config.service";
import { computeProviderCostUsd } from "../src/platform-ops/ai-price-table";
import {
  resetAiUsageDemoStore,
} from "../src/platform-ops/ai-usage-demo.store";
import {
  resetTenantPlatformConfigDemoStore,
  seedTenantPlatformConfigDemo,
} from "../src/platform-ops/tenant-platform-config-demo.store";

describe("M2 platform-ops services", () => {
  const tenantPlatformConfig = new TenantPlatformConfigService();
  const aiUsage = new AiUsageService(tenantPlatformConfig);
  const aiQuota = new AiQuotaService(aiUsage, tenantPlatformConfig);

  beforeEach(() => {
    resetAiUsageDemoStore();
    resetTenantPlatformConfigDemoStore();
  });

  it("computeProviderCostUsd uses price table", () => {
    const cost = computeProviderCostUsd("claude-sonnet-4-6", 1000, 500);
    assert.ok(cost > 0);
  });

  it("assertWithinBudget throws AI_BUDGET_UNSET when budget is null", async () => {
    seedTenantPlatformConfigDemo("tenant-test", { aiMonthlyBudgetUsd: null });
    await assert.rejects(
      () => aiQuota.assertWithinBudget("tenant-test"),
      (error: unknown) => {
        assert.ok(error instanceof PlatformBlockedException);
        const body = error.getResponse() as { error: { code: string } };
        assert.equal(body.error.code, "AI_BUDGET_UNSET");
        return true;
      },
    );
  });

  it("assertWithinBudget throws AI_BUDGET_EXCEEDED when MTD >= budget", async () => {
    seedTenantPlatformConfigDemo("tenant-test", { aiMonthlyBudgetUsd: 0.001 });
    await aiUsage.recordEvent({
      tenantId: "tenant-test",
      platformAgentKey: "sop_generate",
      model: "claude-sonnet-4-6",
      provider: "anthropic",
      inputTokens: 1000,
      outputTokens: 500,
      success: true,
    });

    await assert.rejects(
      () => aiQuota.assertWithinBudget("tenant-test"),
      (error: unknown) => {
        assert.ok(error instanceof PlatformBlockedException);
        const body = error.getResponse() as { error: { code: string } };
        assert.equal(body.error.code, "AI_BUDGET_EXCEEDED");
        return true;
      },
    );
  });

  it("assertFeatureEnabled throws FEATURE_DISABLED when flag off", async () => {
    seedTenantPlatformConfigDemo("tenant-test", {
      aiMonthlyBudgetUsd: 50,
      featureFlags: { sop_compose_enabled: false },
    });

    await assert.rejects(
      () => aiQuota.assertFeatureEnabled("tenant-test", "sop_compose_enabled"),
      (error: unknown) => {
        assert.ok(error instanceof PlatformBlockedException);
        const body = error.getResponse() as { error: { code: string } };
        assert.equal(body.error.code, "FEATURE_DISABLED");
        return true;
      },
    );
  });

  it("recordEvent accumulates MTD spend in demo store", async () => {
    seedTenantPlatformConfigDemo("tenant-gis", { aiMonthlyBudgetUsd: 100 });
    await aiUsage.recordEvent({
      tenantId: "tenant-gis",
      platformAgentKey: "sop_generate",
      model: "mock-claude-sonnet-4-6",
      provider: "anthropic",
      inputTokens: 0,
      outputTokens: 0,
      success: true,
    });

    const mtd = await aiUsage.getMtdCostUsd("tenant-gis");
    assert.equal(mtd, 0);
    await aiQuota.assertWithinBudget("tenant-gis");
  });

  it("blocked error envelope includes supportable flag", () => {
    const error = new PlatformBlockedException(
      "AI_BUDGET_EXCEEDED",
      "limit reached",
      429,
    );
    const body = error.getResponse() as {
      success: false;
      error: { supportable?: boolean; code: string };
    };
    assert.equal(body.success, false);
    assert.equal(body.error.supportable, true);
    assert.equal(body.error.code, "AI_BUDGET_EXCEEDED");
  });
});
