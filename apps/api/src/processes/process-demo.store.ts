import { randomUUID } from "crypto";
import {
  approvalDemoStore,
  resetApprovalDemoStore,
} from "../approvals/approval-demo.store";
import { buildGisRichProcessStore } from "./gis-rich-process.seed";
import { generateProcessCode } from "./process-code";
import type { ExecutionSchedule } from "./execution-schedule";
import { defaultExecutionSchedule } from "./execution-schedule";
import { syncStepControlFields } from "./control-points";
import type { EvidenceMap } from "@aquilens/shared";

export type ProcessStepRecord = {
  id: string;
  tenantId: string;
  processVersionId: string;
  stepNumber: number;
  title: string;
  description?: string;
  responsibleRole?: string;
  stepType: "manual" | "approval" | "system";
  inputs?: string;
  outputs?: string;
  controls?: string;
  notes?: string;
  evidenceRequired: boolean;
  isControlPoint: boolean;
  evidenceMap: EvidenceMap;
};

export type ProcessPersonRecord = {
  id: string;
  processVersionId: string;
  userId?: string;
  role: "owner" | "editor" | "viewer" | "approver";
};

export type ProcessVersionRecord = {
  id: string;
  tenantId: string;
  processId: string;
  versionNumber: number;
  status:
    | "draft"
    | "under_review"
    | "approved"
    | "active"
    | "superseded"
    | "rejected"
    | "archived";
  changeSummary?: string;
  createdBy?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionComment?: string;
  effectiveDate?: string;
  reviewDueDate?: string;
  publishedAt?: string;
  publishedBy?: string;
  archivedAt?: string;
};

export type ProcessDocumentRecord = {
  id: string;
  tenantId: string;
  processId: string;
  processVersionId?: string;
  filename: string;
  storagePath: string;
  mimeType?: string;
  byteSize?: number;
  uploadedBy?: string;
  createdAt: string;
};

export type ProcessRecord = {
  id: string;
  tenantId: string;
  functionId: string;
  processAreaId: string;
  functionName: string;
  processAreaName: string;
  processCode?: string;
  name: string;
  description?: string;
  purpose?: string;
  whoItAffects: string[];
  linkedSystems: string[];
  linkedPolicies?: string;
  tags: string[];
  riskRating: "high" | "medium" | "low";
  riskNotes?: string;
  governanceControls: unknown[];
  approvalRequired: boolean;
  reviewFrequency: string;
  executionSchedule: ExecutionSchedule;
  creationSource: "manual" | "ai_generated";
  regulatoryReference?: string;
  triggerDescription?: string;
  participants: Array<{ role: string; userId?: string }>;
  inputs?: string;
  outputs?: string;
  exceptions?: string;
  relatedDocuments: unknown[];
  acknowledgementRequired: boolean;
  status: "draft" | "under_review" | "active" | "retired" | "archived";
  currentVersionId: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  operatingJurisdictions: string[];
  outputMarketJurisdictions: string[];
  jurisdictionsInheritOrg: boolean;
};

type DemoScaffoldNames = {
  functionId: string;
  functionName: string;
  areaId: string;
  areaName: string;
};

function seedProcess(
  tenantId: string,
  scaffold: DemoScaffoldNames,
  input: {
    id: string;
    name: string;
    status: ProcessRecord["status"];
    riskRating: ProcessRecord["riskRating"];
    sequence: number;
    versionStatus: ProcessVersionRecord["status"];
    createdBy: string;
    reviewFrequency?: string;
    executionSchedule?: ExecutionSchedule;
    people?: Array<{ userId: string; role: ProcessPersonRecord["role"] }>;
    creationSource?: ProcessRecord["creationSource"];
    steps: Array<{
      title: string;
      description?: string;
      stepType?: ProcessStepRecord["stepType"];
      evidenceRequired?: boolean;
      isControlPoint?: boolean;
      evidenceMap?: EvidenceMap;
    }>;
  },
) {
  const versionId = `${input.id}-v1`;
  const now = "2026-05-26T10:00:00.000Z";

  const process: ProcessRecord = {
    id: input.id,
    tenantId,
    functionId: scaffold.functionId,
    processAreaId: scaffold.areaId,
    functionName: scaffold.functionName,
    processAreaName: scaffold.areaName,
    processCode: generateProcessCode(
      scaffold.functionName,
      scaffold.areaName,
      input.sequence,
    ),
    name: input.name,
    purpose: input.name,
    whoItAffects: [],
    linkedSystems: [],
    tags: [],
    riskRating: input.riskRating,
    governanceControls: [],
    approvalRequired: false,
    reviewFrequency: input.reviewFrequency ?? "annually",
    executionSchedule: input.executionSchedule ?? defaultExecutionSchedule,
    creationSource: input.creationSource ?? "manual",
    participants: [],
    relatedDocuments: [],
    acknowledgementRequired: false,
    status: input.status,
    currentVersionId: versionId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
    operatingJurisdictions: [],
    outputMarketJurisdictions: [],
    jurisdictionsInheritOrg: true,
  };

  const version: ProcessVersionRecord = {
    id: versionId,
    tenantId,
    processId: input.id,
    versionNumber: 1,
    status: input.versionStatus,
    createdBy: input.createdBy,
    createdAt: now,
  };

  const steps: ProcessStepRecord[] = input.steps.map((step, index) => {
    const synced = syncStepControlFields({
      isControlPoint: step.isControlPoint,
      evidenceRequired: step.evidenceRequired,
      evidenceMap: step.evidenceMap,
    });
    return {
      id: `${versionId}-step-${index + 1}`,
      tenantId,
      processVersionId: versionId,
      stepNumber: index + 1,
      title: step.title,
      description: step.description,
      stepType: step.stepType ?? "manual",
      evidenceRequired: synced.evidenceRequired,
      isControlPoint: synced.isControlPoint,
      evidenceMap: synced.evidenceMap,
    };
  });

  return { process, version, steps, people: input.people ?? [] };
}

function cloneStepsForVersion(
  tenantId: string,
  sourceVersionId: string,
  targetVersionId: string,
  steps: Map<string, ProcessStepRecord>,
) {
  const sourceSteps = [...steps.values()]
    .filter((step) => step.processVersionId === sourceVersionId)
    .sort((a, b) => a.stepNumber - b.stepNumber);

  for (const step of sourceSteps) {
    const cloned: ProcessStepRecord = {
      ...step,
      id: randomUUID(),
      processVersionId: targetVersionId,
    };
    steps.set(cloned.id, cloned);
  }
}

function clonePeopleForVersion(
  sourceVersionId: string,
  targetVersionId: string,
  people: Map<string, ProcessPersonRecord>,
) {
  for (const person of people.values()) {
    if (person.processVersionId !== sourceVersionId) {
      continue;
    }
    const id = randomUUID();
    people.set(id, {
      ...person,
      id,
      processVersionId: targetVersionId,
    });
  }
}

function buildInitialStore() {
  return buildGisRichProcessStore();
}

let store = buildInitialStore();

export class ProcessDemoStore {
  listProcesses(tenantId: string, filters: ProcessListFilters = {}) {
    return [...store.processes.values()]
      .filter((process) => process.tenantId === tenantId)
      .filter((process) => matchesFilters(process, filters))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getProcess(tenantId: string, processId: string) {
    const process = store.processes.get(processId);
    if (!process || process.tenantId !== tenantId) {
      return null;
    }
    return process;
  }

  getVersion(versionId: string) {
    return store.versions.get(versionId) ?? null;
  }

  listVersions(processId: string) {
    return [...store.versions.values()]
      .filter((version) => version.processId === processId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  listSteps(versionId: string) {
    return [...store.steps.values()]
      .filter((step) => step.processVersionId === versionId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  listPeople(versionId: string) {
    return [...store.people.values()].filter(
      (person) => person.processVersionId === versionId,
    );
  }

  /** Grants read access for acknowledgement assignees without removing existing roles. */
  ensureViewerAccess(versionId: string, userIds: string[]) {
    const existing = this.listPeople(versionId);
    const rolesByUser = new Map(
      existing
        .filter((person) => person.userId)
        .map((person) => [person.userId!, person.role]),
    );

    for (const userId of userIds) {
      const current = rolesByUser.get(userId);
      if (!current) {
        const id = randomUUID();
        store.people.set(id, {
          id,
          processVersionId: versionId,
          userId,
          role: "viewer",
        });
        rolesByUser.set(userId, "viewer");
      }
    }

    return this.listPeople(versionId);
  }

  countProcessesInArea(tenantId: string, functionId: string, areaId: string) {
    return [...store.processes.values()].filter(
      (process) =>
        process.tenantId === tenantId &&
        process.functionId === functionId &&
        process.processAreaId === areaId,
    ).length;
  }

  createProcess(
    tenantId: string,
    userId: string,
    input: CreateProcessInput,
    scaffoldNames: { functionName: string; areaName: string },
  ) {
    const processId = randomUUID();
    const versionId = randomUUID();
    const now = new Date().toISOString();
    const sequence =
      this.countProcessesInArea(tenantId, input.functionId, input.processAreaId) + 1;

    const process: ProcessRecord = {
      id: processId,
      tenantId,
      functionId: input.functionId,
      processAreaId: input.processAreaId,
      functionName: scaffoldNames.functionName,
      processAreaName: scaffoldNames.areaName,
      processCode: generateProcessCode(
        scaffoldNames.functionName,
        scaffoldNames.areaName,
        sequence,
      ),
      name: input.name,
      description: input.description,
      purpose: input.purpose,
      whoItAffects: input.whoItAffects ?? [],
      linkedSystems: input.linkedSystems ?? [],
      linkedPolicies: input.linkedPolicies,
      tags: input.tags ?? [],
      riskRating: input.riskRating ?? "medium",
      riskNotes: input.riskNotes,
      governanceControls: input.governanceControls ?? [],
      approvalRequired: input.approvalRequired ?? false,
      reviewFrequency: input.reviewFrequency ?? "annually",
      executionSchedule: input.executionSchedule ?? defaultExecutionSchedule,
      creationSource: input.creationSource ?? "manual",
      regulatoryReference: input.regulatoryReference,
      participants: [],
      relatedDocuments: [],
      acknowledgementRequired: false,
      status: "draft",
      currentVersionId: versionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      operatingJurisdictions: [],
      outputMarketJurisdictions: [],
      jurisdictionsInheritOrg: true,
    };

    const version: ProcessVersionRecord = {
      id: versionId,
      tenantId,
      processId,
      versionNumber: 1,
      status: "draft",
      createdBy: userId,
      createdAt: now,
    };

    store.processes.set(processId, process);
    store.versions.set(versionId, version);

    return { process, version };
  }

  updateProcess(tenantId: string, processId: string, patch: UpdateProcessInput) {
    const process = this.getProcess(tenantId, processId);
    if (!process) {
      return null;
    }

    const updated: ProcessRecord = {
      ...process,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    store.processes.set(processId, updated);
    return updated;
  }

  retireProcess(tenantId: string, processId: string) {
    return this.updateProcess(tenantId, processId, { status: "retired" });
  }

  addStep(
    tenantId: string,
    versionId: string,
    input: Omit<CreateStepInput, "stepNumber"> & { stepNumber?: number },
  ) {
    const existing = this.listSteps(versionId);
    const stepNumber = input.stepNumber ?? existing.length + 1;
    const synced = syncStepControlFields(input);
    const step: ProcessStepRecord = {
      id: randomUUID(),
      tenantId,
      processVersionId: versionId,
      stepNumber,
      title: input.title,
      description: input.description,
      responsibleRole: input.responsibleRole,
      stepType: input.stepType ?? "manual",
      inputs: input.inputs,
      outputs: input.outputs,
      controls: input.controls,
      notes: input.notes,
      evidenceRequired: synced.evidenceRequired,
      isControlPoint: synced.isControlPoint,
      evidenceMap: synced.evidenceMap,
    };
    store.steps.set(step.id, step);
    return step;
  }

  updateStep(stepId: string, patch: Partial<ProcessStepRecord>) {
    const step = store.steps.get(stepId);
    if (!step) {
      return null;
    }
    const synced = syncStepControlFields({
      isControlPoint: patch.isControlPoint ?? step.isControlPoint,
      evidenceRequired: patch.evidenceRequired ?? step.evidenceRequired,
      evidenceMap: patch.evidenceMap ?? step.evidenceMap,
    });
    const updated = {
      ...step,
      ...patch,
      evidenceRequired: synced.evidenceRequired,
      isControlPoint: synced.isControlPoint,
      evidenceMap: synced.evidenceMap,
    };
    store.steps.set(stepId, updated);
    return updated;
  }

  deleteStep(stepId: string) {
    store.steps.delete(stepId);
  }

  reorderSteps(versionId: string, orderedIds: string[]) {
    orderedIds.forEach((id, index) => {
      const step = store.steps.get(id);
      if (step && step.processVersionId === versionId) {
        store.steps.set(id, { ...step, stepNumber: index + 1 });
      }
    });
    return this.listSteps(versionId);
  }

  replacePeople(
    versionId: string,
    entries: Array<{ userId?: string; role: ProcessPersonRecord["role"] }>,
  ) {
    for (const [id, person] of store.people.entries()) {
      if (person.processVersionId === versionId) {
        store.people.delete(id);
      }
    }

    for (const entry of entries) {
      const id = randomUUID();
      store.people.set(id, {
        id,
        processVersionId: versionId,
        userId: entry.userId,
        role: entry.role,
      });
    }

    return this.listPeople(versionId);
  }

  resolveApprover(versionId: string) {
    const approver = this.listPeople(versionId).find(
      (person) => person.role === "approver",
    );
    return approver?.userId ?? "user-gis-head";
  }

  submitForApproval(tenantId: string, processId: string, submittedBy: string) {
    const process = this.getProcess(tenantId, processId);
    if (!process) {
      return null;
    }
    const version = this.getVersion(process.currentVersionId);
    if (!version) {
      return null;
    }

    const now = new Date().toISOString();
    store.processes.set(processId, {
      ...process,
      status: "under_review",
      updatedAt: now,
    });
    store.versions.set(version.id, { ...version, status: "under_review" });

    const approval = approvalDemoStore.create({
      tenantId,
      entityType: "process_version",
      entityId: version.id,
      processId,
      status: "pending",
      approverId: this.resolveApprover(version.id),
      submittedBy,
      submittedAt: now,
    });

    return { process: store.processes.get(processId)!, approval };
  }

  approveVersion(
    tenantId: string,
    processId: string,
    approverId: string,
    comment?: string,
  ) {
    const process = this.getProcess(tenantId, processId);
    if (!process) {
      return null;
    }
    const version = this.getVersion(process.currentVersionId);
    if (!version) {
      return null;
    }

    const pending = approvalDemoStore
      .listForProcess(processId)
      .find(
        (item) =>
          item.entityId === version.id &&
          item.status === "pending" &&
          item.approverId === approverId,
      );

    if (!pending) {
      return null;
    }

    const now = new Date().toISOString();
    store.processes.set(processId, {
      ...process,
      status: "under_review",
      updatedAt: now,
    });
    store.versions.set(version.id, {
      ...version,
      status: "approved",
      approvedBy: approverId,
      approvedAt: now,
    });
    approvalDemoStore.update(pending.id, {
      status: "approved",
      decidedAt: now,
      comment,
    });

    return { process: store.processes.get(processId)!, approvalId: pending.id };
  }

  rejectVersion(
    tenantId: string,
    processId: string,
    approverId: string,
    comment: string,
  ) {
    const process = this.getProcess(tenantId, processId);
    if (!process) {
      return null;
    }
    const version = this.getVersion(process.currentVersionId);
    if (!version) {
      return null;
    }

    const pending = approvalDemoStore
      .listForProcess(processId)
      .find(
        (item) =>
          item.entityId === version.id &&
          item.status === "pending" &&
          item.approverId === approverId,
      );

    if (!pending) {
      return null;
    }

    const now = new Date().toISOString();
    store.processes.set(processId, {
      ...process,
      status: "draft",
      updatedAt: now,
    });
    store.versions.set(version.id, {
      ...version,
      status: "rejected",
      rejectedBy: approverId,
      rejectedAt: now,
      rejectionComment: comment,
    });
    approvalDemoStore.update(pending.id, {
      status: "rejected",
      decidedAt: now,
      comment,
    });

    return { process: store.processes.get(processId)!, approvalId: pending.id };
  }

  createNewVersion(tenantId: string, processId: string, createdBy: string) {
    const process = this.getProcess(tenantId, processId);
    if (!process || process.status !== "active") {
      return null;
    }

    const currentVersion = this.getVersion(process.currentVersionId);
    if (!currentVersion) {
      return null;
    }

    const versions = this.listVersions(processId);
    const nextNumber = (versions[0]?.versionNumber ?? 0) + 1;
    const versionId = randomUUID();
    const now = new Date().toISOString();

    const newVersion: ProcessVersionRecord = {
      id: versionId,
      tenantId,
      processId,
      versionNumber: nextNumber,
      status: "draft",
      changeSummary: `Draft v${nextNumber}`,
      createdBy,
      createdAt: now,
    };

    store.versions.set(versionId, newVersion);
    cloneStepsForVersion(tenantId, currentVersion.id, versionId, store.steps);
    clonePeopleForVersion(currentVersion.id, versionId, store.people);

    store.processes.set(processId, {
      ...process,
      status: "draft",
      currentVersionId: versionId,
      updatedAt: now,
    });

    return {
      process: store.processes.get(processId)!,
      version: newVersion,
    };
  }

  publishVersion(
    tenantId: string,
    processId: string,
    publisherId: string,
    input: { effectiveDate: string; reviewDueDate?: string },
  ) {
    const process = this.getProcess(tenantId, processId);
    if (!process) {
      return null;
    }
    const version = this.getVersion(process.currentVersionId);
    if (!version) {
      return null;
    }
    if (version.status !== "approved" && version.status !== "active") {
      return null;
    }

    const now = new Date().toISOString();
    store.processes.set(processId, {
      ...process,
      status: "active",
      updatedAt: now,
    });
    store.versions.set(version.id, {
      ...version,
      status: "active",
      effectiveDate: input.effectiveDate,
      reviewDueDate: input.reviewDueDate,
      publishedAt: now,
      publishedBy: publisherId,
    });

    return {
      process: store.processes.get(processId)!,
      version: store.versions.get(version.id)!,
    };
  }

  archiveProcess(tenantId: string, processId: string) {
    const process = this.getProcess(tenantId, processId);
    if (!process) {
      return null;
    }
    const version = this.getVersion(process.currentVersionId);
    const now = new Date().toISOString();

    store.processes.set(processId, {
      ...process,
      status: "archived",
      updatedAt: now,
    });

    if (version) {
      store.versions.set(version.id, {
        ...version,
        status: "archived",
        archivedAt: now,
      });
    }

    return store.processes.get(processId)!;
  }

  listDocuments(tenantId: string, processId: string) {
    return [...store.documents.values()]
      .filter(
        (document) =>
          document.tenantId === tenantId && document.processId === processId,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addDocument(
    tenantId: string,
    processId: string,
    input: {
      filename: string;
      storagePath: string;
      mimeType?: string;
      byteSize?: number;
      uploadedBy?: string;
      processVersionId?: string;
    },
  ) {
    const id = randomUUID();
    const document: ProcessDocumentRecord = {
      id,
      tenantId,
      processId,
      processVersionId: input.processVersionId,
      filename: input.filename,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      uploadedBy: input.uploadedBy,
      createdAt: new Date().toISOString(),
    };
    store.documents.set(id, document);
    return document;
  }
}

export type ProcessListFilters = {
  status?: string;
  riskRating?: string;
  functionId?: string;
  tag?: string;
};

export type CreateProcessInput = {
  functionId: string;
  processAreaId: string;
  name: string;
  description?: string;
  purpose?: string;
  whoItAffects?: string[];
  linkedSystems?: string[];
  linkedPolicies?: string;
  tags?: string[];
  riskRating?: ProcessRecord["riskRating"];
  riskNotes?: string;
  governanceControls?: unknown[];
  approvalRequired?: boolean;
  reviewFrequency?: string;
  executionSchedule?: ExecutionSchedule;
  regulatoryReference?: string;
  creationSource?: "manual" | "ai_generated";
};

export type UpdateProcessInput = Partial<
  Omit<ProcessRecord, "id" | "tenantId" | "functionId" | "processAreaId" | "currentVersionId" | "createdAt" | "createdBy">
>;

export type CreateStepInput = {
  stepNumber: number;
  title: string;
  description?: string;
  responsibleRole?: string;
  stepType?: ProcessStepRecord["stepType"];
  inputs?: string;
  outputs?: string;
  controls?: string;
  notes?: string;
  evidenceRequired?: boolean;
  isControlPoint?: boolean;
  evidenceMap?: EvidenceMap;
};

function matchesFilters(process: ProcessRecord, filters: ProcessListFilters) {
  if (filters.status && process.status !== filters.status) {
    return false;
  }
  if (filters.riskRating && process.riskRating !== filters.riskRating) {
    return false;
  }
  if (filters.functionId && process.functionId !== filters.functionId) {
    return false;
  }
  if (filters.tag && !process.tags.includes(filters.tag)) {
    return false;
  }
  return true;
}

export const processDemoStore = new ProcessDemoStore();

export function resetProcessDemoStore() {
  resetApprovalDemoStore();
  store = buildInitialStore();
}
