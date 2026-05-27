import { randomUUID } from "crypto";
import { generateProcessCode } from "./process-code";
import type { ExecutionSchedule } from "./execution-schedule";
import { defaultExecutionSchedule } from "./execution-schedule";

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
  status: "draft" | "under_review" | "active" | "superseded" | "rejected";
  changeSummary?: string;
  createdBy?: string;
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
  status: "draft" | "under_review" | "active" | "retired";
  currentVersionId: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

type DemoScaffoldNames = {
  functionId: string;
  functionName: string;
  areaId: string;
  areaName: string;
};

const gisScaffold: DemoScaffoldNames[] = [
  {
    functionId: "fn-school-academics",
    functionName: "Academics",
    areaId: "area-school-academics-student-records",
    areaName: "Student Records",
  },
  {
    functionId: "fn-school-admissions",
    functionName: "Admissions",
    areaId: "area-school-admissions-enrolment",
    areaName: "Enrolment",
  },
  {
    functionId: "fn-school-finance",
    functionName: "Finance",
    areaId: "area-school-finance-fees-billing",
    areaName: "Fees & Billing",
  },
];

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
    status: input.status,
    currentVersionId: versionId,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
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

  const steps: ProcessStepRecord[] = input.steps.map((step, index) => ({
    id: `${versionId}-step-${index + 1}`,
    tenantId,
    processVersionId: versionId,
    stepNumber: index + 1,
    title: step.title,
    description: step.description,
    stepType: step.stepType ?? "manual",
    evidenceRequired: step.evidenceRequired ?? false,
  }));

  return { process, version, steps, people: input.people ?? [] };
}

function buildInitialStore() {
  const processes = new Map<string, ProcessRecord>();
  const versions = new Map<string, ProcessVersionRecord>();
  const steps = new Map<string, ProcessStepRecord>();
  const people = new Map<string, ProcessPersonRecord>();

  const seeds = [
    seedProcess("tenant-gis", gisScaffold[0]!, {
      id: "proc-gis-attendance",
      name: "Record Student Attendance",
      status: "draft",
      riskRating: "medium",
      sequence: 1,
      versionStatus: "draft",
      createdBy: "user-gis-owner",
      reviewFrequency: "quarterly",
      executionSchedule: { kind: "daily", timezone: "Africa/Accra" },
      people: [
        { userId: "user-gis-owner", role: "owner" },
        { userId: "user-gis-staff", role: "viewer" },
      ],
      steps: [
        { title: "Teacher takes register", description: "Manual attendance capture" },
        { title: "Discrepancies flagged to admin" },
        { title: "Absence notified to parents" },
      ],
    }),
    seedProcess("tenant-gis", gisScaffold[1]!, {
      id: "proc-gis-enrolment",
      name: "Enrol New Student",
      status: "active",
      riskRating: "high",
      sequence: 1,
      versionStatus: "active",
      createdBy: "user-gis-owner",
      reviewFrequency: "annually",
      executionSchedule: { kind: "ad_hoc" },
      people: [{ userId: "user-gis-owner", role: "owner" }],
      steps: [
        { title: "Receive application" },
        { title: "Conduct interview", stepType: "approval" },
        { title: "Confirm placement" },
        { title: "Collect documentation", evidenceRequired: true },
        { title: "Create student record in SIS" },
      ],
    }),
    seedProcess("tenant-gis", gisScaffold[2]!, {
      id: "proc-gis-fees",
      name: "Issue Fee Invoice",
      status: "draft",
      riskRating: "low",
      sequence: 1,
      versionStatus: "draft",
      createdBy: "user-gis-owner",
      reviewFrequency: "annually",
      executionSchedule: {
        kind: "monthly",
        dayOfMonth: 1,
        timezone: "Africa/Accra",
      },
      people: [{ userId: "user-gis-owner", role: "owner" }],
      steps: [
        { title: "Generate invoice from fee schedule" },
        { title: "Review invoice totals" },
        { title: "Send invoice to guardian" },
      ],
    }),
  ];

  for (const seed of seeds) {
    processes.set(seed.process.id, seed.process);
    versions.set(seed.version.id, seed.version);
    for (const step of seed.steps) {
      steps.set(step.id, step);
    }
    for (const person of seed.people) {
      people.set(`${seed.version.id}-${person.userId}-${person.role}`, {
        id: `${seed.version.id}-${person.userId}-${person.role}`,
        processVersionId: seed.version.id,
        userId: person.userId,
        role: person.role,
      });
    }
  }

  return { processes, versions, steps, people };
}

const store = buildInitialStore();

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
      status: "draft",
      currentVersionId: versionId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
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
      evidenceRequired: input.evidenceRequired ?? false,
    };
    store.steps.set(step.id, step);
    return step;
  }

  updateStep(stepId: string, patch: Partial<ProcessStepRecord>) {
    const step = store.steps.get(stepId);
    if (!step) {
      return null;
    }
    const updated = { ...step, ...patch };
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
