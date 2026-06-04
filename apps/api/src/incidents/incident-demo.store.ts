import { randomUUID } from "crypto";

export type IncidentActionRecord = {
  id: string;
  tenantId: string;
  incidentId: string;
  actionType: "corrective" | "preventive";
  description: string;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed";
  completedBy?: string;
  completedAt?: string;
  evidenceNotes?: string;
  referenceUrls: string[];
  evidenceFileIds: string[];
};

export type IncidentRecord = {
  id: string;
  tenantId: string;
  incidentCode: string;
  title: string;
  description: string;
  incidentType: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  linkedProcessId?: string;
  linkedWorkflowInstanceId?: string;
  loggedBy: string;
  loggedAt: string;
  closedBy?: string;
  closedAt?: string;
};

const incidents = new Map<string, IncidentRecord>();
const actions = new Map<string, IncidentActionRecord>();
const sequences = new Map<string, number>();

export function resetIncidentDemoStore() {
  incidents.clear();
  actions.clear();
  sequences.clear();
}

function nextCode(tenantId: string) {
  const seq = (sequences.get(tenantId) ?? 0) + 1;
  sequences.set(tenantId, seq);
  return `INC-${String(seq).padStart(3, "0")}`;
}

export const incidentDemoStore = {
  list(tenantId: string, filters?: { status?: string }) {
    return [...incidents.values()]
      .filter((row) => row.tenantId === tenantId)
      .filter((row) => !filters?.status || row.status === filters.status)
      .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  },

  get(tenantId: string, id: string) {
    const incident = incidents.get(id);
    if (!incident || incident.tenantId !== tenantId) {
      return null;
    }
    return incident;
  },

  listActions(incidentId: string) {
    return [...actions.values()].filter((row) => row.incidentId === incidentId);
  },

  create(input: Omit<IncidentRecord, "id" | "incidentCode" | "status">) {
    const id = randomUUID();
    const record: IncidentRecord = {
      ...input,
      id,
      incidentCode: nextCode(input.tenantId),
      status: "open",
    };
    incidents.set(id, record);
    return record;
  },

  update(id: string, patch: Partial<IncidentRecord>) {
    const existing = incidents.get(id);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    incidents.set(id, updated);
    return updated;
  },

  addAction(
    input: Omit<IncidentActionRecord, "id" | "status" | "referenceUrls" | "evidenceFileIds"> & {
      referenceUrls?: string[];
      evidenceFileIds?: string[];
    },
  ) {
    const record: IncidentActionRecord = {
      ...input,
      id: randomUUID(),
      status: "pending",
      referenceUrls: input.referenceUrls ?? [],
      evidenceFileIds: input.evidenceFileIds ?? [],
    };
    actions.set(record.id, record);
    return record;
  },

  completeAction(
    actionId: string,
    patch: {
      completedBy: string;
      evidenceNotes?: string;
      referenceUrls?: string[];
      evidenceFileIds?: string[];
    },
  ) {
    const existing = actions.get(actionId);
    if (!existing) {
      return null;
    }
    const updated: IncidentActionRecord = {
      ...existing,
      status: "completed",
      completedBy: patch.completedBy,
      completedAt: new Date().toISOString(),
      evidenceNotes: patch.evidenceNotes,
      referenceUrls: patch.referenceUrls ?? existing.referenceUrls,
      evidenceFileIds: patch.evidenceFileIds ?? existing.evidenceFileIds,
    };
    actions.set(actionId, updated);
    return updated;
  },
};
