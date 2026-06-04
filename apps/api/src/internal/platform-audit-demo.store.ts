import { randomUUID } from "crypto";

export type PlatformAuditEntry = {
  id: string;
  timestamp: string;
  actorEmail: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  action: string;
  metadata: Record<string, unknown>;
};

const rows: PlatformAuditEntry[] = [];

export function resetPlatformAuditDemoStore() {
  rows.length = 0;
}

export const platformAuditDemoStore = {
  append(entry: Omit<PlatformAuditEntry, "id" | "timestamp">) {
    const row: PlatformAuditEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    rows.unshift(row);
    return row;
  },

  list(filters: { limit?: number; eventType?: string } = {}) {
    let result = [...rows];
    if (filters.eventType) {
      result = result.filter((row) => row.eventType === filters.eventType);
    }
    return result.slice(0, filters.limit ?? 100);
  },
};
