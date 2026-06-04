import { randomUUID } from "crypto";

export type SiaiRecord = {
  id: string;
  tenantId: string;
  siaiCode: string;
  title: string;
  description: string;
  category: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  linkedProcessId?: string;
  linkedWorkflowInstanceId?: string;
  loggedBy: string;
  loggedAt: string;
};

const records = new Map<string, SiaiRecord>();
const sequences = new Map<string, number>();

export function resetSiaiDemoStore() {
  records.clear();
  sequences.clear();
}

function nextCode(tenantId: string) {
  const seq = (sequences.get(tenantId) ?? 0) + 1;
  sequences.set(tenantId, seq);
  return `SIAI-${String(seq).padStart(3, "0")}`;
}

export const siaiDemoStore = {
  list(tenantId: string) {
    return [...records.values()]
      .filter((row) => row.tenantId === tenantId)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  },

  get(tenantId: string, id: string) {
    const row = records.get(id);
    if (!row || row.tenantId !== tenantId) {
      return null;
    }
    return row;
  },

  create(input: Omit<SiaiRecord, "id" | "siaiCode" | "status">) {
    const id = randomUUID();
    const record: SiaiRecord = {
      ...input,
      id,
      siaiCode: nextCode(input.tenantId),
      status: "open",
    };
    records.set(id, record);
    return record;
  },

  update(id: string, patch: Partial<SiaiRecord>) {
    const existing = records.get(id);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    records.set(id, updated);
    return updated;
  },
};
