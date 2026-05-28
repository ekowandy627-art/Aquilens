import { randomUUID } from "crypto";

export type ApprovalRecord = {
  id: string;
  tenantId: string;
  entityType: "process_version";
  entityId: string;
  processId: string;
  status: "pending" | "approved" | "rejected";
  approverId?: string;
  submittedBy?: string;
  submittedAt: string;
  decidedAt?: string;
  comment?: string;
};

const approvals = new Map<string, ApprovalRecord>();

export function seedApproval(record: Omit<ApprovalRecord, "id"> & { id?: string }) {
  const id = record.id ?? randomUUID();
  approvals.set(id, { ...record, id });
  return id;
}

export class ApprovalDemoStore {
  create(input: Omit<ApprovalRecord, "id">) {
    const id = randomUUID();
    approvals.set(id, { ...input, id });
    return approvals.get(id)!;
  }

  get(id: string) {
    return approvals.get(id) ?? null;
  }

  listForApprover(tenantId: string, approverId: string, status?: string) {
    return [...approvals.values()]
      .filter(
        (item) =>
          item.tenantId === tenantId &&
          item.approverId === approverId &&
          (!status || item.status === status),
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  listForProcess(processId: string) {
    return [...approvals.values()]
      .filter((item) => item.processId === processId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  update(id: string, patch: Partial<ApprovalRecord>) {
    const existing = approvals.get(id);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    approvals.set(id, updated);
    return updated;
  }

  pendingCountForApprover(tenantId: string, approverId: string) {
    return this.listForApprover(tenantId, approverId, "pending").length;
  }
}

export const approvalDemoStore = new ApprovalDemoStore();

export function resetApprovalDemoStore() {
  approvals.clear();
}
