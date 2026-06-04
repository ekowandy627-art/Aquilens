import type { RecordAiUsageInput } from "./platform-ops.types";

type UsageRow = RecordAiUsageInput & {
  id: string;
  createdAt: string;
  providerCostUsd: number;
  billedCostUsd: number | null;
};

const rows: UsageRow[] = [];

export function resetAiUsageDemoStore() {
  rows.length = 0;
}

export const aiUsageDemoStore = {
  record(input: RecordAiUsageInput & { providerCostUsd: number; billedCostUsd: number | null }) {
    const row: UsageRow = {
      ...input,
      id: `usage-${rows.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    rows.push(row);
    return row;
  },

  listForTenant(tenantId: string) {
    return rows.filter((row) => row.tenantId === tenantId);
  },

  getMtdCostUsd(tenantId: string, now = new Date()) {
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    return rows
      .filter(
        (row) =>
          row.tenantId === tenantId &&
          Date.parse(row.createdAt) >= monthStart,
      )
      .reduce((sum, row) => sum + row.providerCostUsd, 0);
  },
};
