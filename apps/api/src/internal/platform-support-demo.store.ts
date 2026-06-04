import { randomUUID } from "crypto";

export type SupportAccessLogEntry = {
  id: string;
  tenantId: string;
  platformEmail: string;
  platformUserId?: string;
  supportUserId?: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  magicLinkIssuedAt: string;
};

const rows: SupportAccessLogEntry[] = [];

export function resetPlatformSupportDemoStore() {
  rows.length = 0;
}

export const platformSupportDemoStore = {
  append(entry: Omit<SupportAccessLogEntry, "id" | "startedAt" | "magicLinkIssuedAt">) {
    const now = new Date().toISOString();
    const row: SupportAccessLogEntry = {
      id: randomUUID(),
      startedAt: now,
      magicLinkIssuedAt: now,
      ...entry,
    };
    rows.unshift(row);
    return row;
  },

  listForTenant(tenantId: string) {
    return rows.filter((row) => row.tenantId === tenantId);
  },

  listRecent(limit = 50) {
    return rows.slice(0, limit);
  },
};
