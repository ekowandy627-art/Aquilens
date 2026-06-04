import { randomUUID } from "crypto";

export type GapAnalysisRecord = {
  id: string;
  tenantId: string;
  familyId: string;
  fromPackId: string;
  toPackId: string;
  status: "pending" | "running" | "complete" | "failed";
  triggeredBy: string;
  results: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
};

const analyses = new Map<string, GapAnalysisRecord>();

export const standardsGapDemoStore = {
  create(input: Omit<GapAnalysisRecord, "id" | "createdAt" | "status">) {
    const row: GapAnalysisRecord = {
      id: randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
      ...input,
    };
    analyses.set(row.id, row);
    return row;
  },

  update(id: string, patch: Partial<GapAnalysisRecord>) {
    const existing = analyses.get(id);
    if (!existing) {
      return null;
    }
    const next = { ...existing, ...patch };
    analyses.set(id, next);
    return next;
  },

  get(id: string, tenantId: string) {
    const row = analyses.get(id);
    if (!row || row.tenantId !== tenantId) {
      return null;
    }
    return row;
  },

  reset() {
    analyses.clear();
  },
};

export function resetStandardsGapDemoStore() {
  standardsGapDemoStore.reset();
}
