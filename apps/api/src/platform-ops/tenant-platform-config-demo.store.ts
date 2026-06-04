import type { TenantPlatformConfigRecord } from "./platform-ops.types";
import { DEFAULT_FEATURE_FLAGS } from "./platform-ops.types";

const configs = new Map<string, TenantPlatformConfigRecord>();

export function resetTenantPlatformConfigDemoStore() {
  configs.clear();
}

const DEMO_TENANT_BUDGETS: Record<string, number> = {
  "tenant-gis": 100,
  "tenant-mfg": 100,
  "tenant-hospital": 100,
};

export function seedTenantPlatformConfigDemo(
  tenantId: string,
  overrides: Partial<TenantPlatformConfigRecord> = {},
) {
  const row: TenantPlatformConfigRecord = {
    tenantId,
    lifecycleState: "active",
    aiMonthlyBudgetUsd: DEMO_TENANT_BUDGETS[tenantId] ?? null,
    markupMultiplier: null,
    featureFlags: { ...DEFAULT_FEATURE_FLAGS },
    modelRouting: {},
    ...overrides,
  };
  configs.set(tenantId, row);
  return row;
}

export const tenantPlatformConfigDemoStore = {
  get(tenantId: string): TenantPlatformConfigRecord | null {
    return configs.get(tenantId) ?? null;
  },

  upsert(row: TenantPlatformConfigRecord) {
    configs.set(row.tenantId, row);
    return row;
  },

  ensureDefault(tenantId: string) {
    if (!configs.has(tenantId)) {
      seedTenantPlatformConfigDemo(tenantId);
    }
    return configs.get(tenantId)!;
  },
};
