import { randomUUID } from "crypto";

export type VerificationStatus = "unverified" | "sampled" | "verified";

export type RecurringControlRecord = {
  id: string;
  tenantId: string;
  title: string;
  controlPointStepId?: string;
  processId?: string;
  recordLocation: string;
  ownerId: string;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  verificationStatus: VerificationStatus;
};

const records = new Map<string, RecurringControlRecord>();

function seed() {
  if (records.size > 0) {
    return;
  }
  records.set("rc-gis-attendance-log", {
    id: "rc-gis-attendance-log",
    tenantId: "tenant-gis",
    title: "Daily attendance register",
    controlPointStepId: "step-gis-attendance-control",
    processId: "proc-gis-attendance",
    recordLocation: "SIMS / attendance module",
    ownerId: "user-gis-owner",
    frequency: "daily",
    verificationStatus: "sampled",
  });
}

seed();

export function resetRecurringControlsDemoStore() {
  records.clear();
  seed();
}

export const recurringControlsDemoStore = {
  list(tenantId: string) {
    return [...records.values()].filter((row) => row.tenantId === tenantId);
  },

  get(tenantId: string, id: string) {
    const row = records.get(id);
    if (!row || row.tenantId !== tenantId) {
      return null;
    }
    return row;
  },

  create(input: Omit<RecurringControlRecord, "id" | "verificationStatus">) {
    const id = randomUUID();
    const record: RecurringControlRecord = {
      ...input,
      id,
      verificationStatus: "unverified",
    };
    records.set(id, record);
    return record;
  },

  updateVerification(tenantId: string, id: string, status: VerificationStatus) {
    const row = this.get(tenantId, id);
    if (!row) {
      return null;
    }
    const updated = { ...row, verificationStatus: status };
    records.set(id, updated);
    return updated;
  },
};
