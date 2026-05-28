import { randomUUID } from "crypto";
import { processDemoStore } from "../processes/process-demo.store";
import type { ProcessStepRecord } from "../processes/process-demo.store";

export type WorkflowTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped"
  | "approved"
  | "rejected";

export type WorkflowInstanceRecord = {
  id: string;
  tenantId: string;
  processId: string;
  processVersionId: string;
  processName: string;
  processCode?: string;
  title: string;
  context?: string;
  status: "in_progress" | "completed" | "cancelled";
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
};

export type WorkflowTaskRecord = {
  id: string;
  tenantId: string;
  workflowInstanceId: string;
  processStepId?: string;
  stepNumber: number;
  title: string;
  description?: string;
  stepType: "manual" | "approval";
  status: WorkflowTaskStatus;
  assignedTo?: string;
  assignedRole?: string;
  evidenceRequired: boolean;
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  skipReason?: string;
};

export type WorkflowAuditRecord = {
  id: string;
  workflowInstanceId: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  action: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
};

const instances = new Map<string, WorkflowInstanceRecord>();
const tasks = new Map<string, WorkflowTaskRecord>();
const auditEvents = new Map<string, WorkflowAuditRecord>();

function seedWorkflow(input: {
  instance: Omit<WorkflowInstanceRecord, "id"> & { id?: string };
  taskRows: Array<
    Omit<WorkflowTaskRecord, "id" | "tenantId" | "workflowInstanceId"> & { id?: string }
  >;
  audit?: Array<Omit<WorkflowAuditRecord, "id" | "workflowInstanceId"> & { id?: string }>;
}) {
  const instanceId = input.instance.id ?? randomUUID();
  const tenantId = input.instance.tenantId;
  instances.set(instanceId, { ...input.instance, id: instanceId });

  for (const row of input.taskRows) {
    const taskId = row.id ?? randomUUID();
    tasks.set(taskId, {
      ...row,
      id: taskId,
      tenantId,
      workflowInstanceId: instanceId,
    });
  }

  for (const event of input.audit ?? []) {
    const eventId = event.id ?? randomUUID();
    auditEvents.set(eventId, {
      ...event,
      id: eventId,
      workflowInstanceId: instanceId,
    });
  }

  return instanceId;
}

function buildInitialStore() {
  instances.clear();
  tasks.clear();
  auditEvents.clear();

  const enrolmentV3Id = "proc-gis-enrolment-v3";
  const safeguardingVersionId = "proc-gis-safeguarding-v1";

  seedWorkflow({
    instance: {
      id: "workflow-gis-enrolment-t1",
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: enrolmentV3Id,
      processName: "Enrol New Student",
      processCode: "ADMN-ENR-001",
      title: "Enrol New Student — Term 1, 2025/26",
      context: "Term 1 intake",
      status: "completed",
      startedBy: "user-gis-owner",
      startedAt: "2026-05-01T09:00:00.000Z",
      completedAt: "2026-05-20T16:00:00.000Z",
    },
    taskRows: [
      {
        id: "workflow-gis-enrolment-t1-task-1",
        processStepId: `${enrolmentV3Id}-step-1`,
        stepNumber: 1,
        title: "Receive application",
        stepType: "manual",
        status: "completed",
        assignedTo: "user-gis-staff",
        evidenceRequired: false,
        completedAt: "2026-05-05T10:00:00.000Z",
        completedBy: "user-gis-staff",
      },
      {
        id: "workflow-gis-enrolment-t1-task-2",
        processStepId: `${enrolmentV3Id}-step-2`,
        stepNumber: 2,
        title: "Conduct interview",
        stepType: "approval",
        status: "completed",
        assignedTo: "user-gis-head",
        evidenceRequired: false,
        completedAt: "2026-05-08T11:00:00.000Z",
        completedBy: "user-gis-head",
      },
      {
        id: "workflow-gis-enrolment-t1-task-3",
        processStepId: `${enrolmentV3Id}-step-5`,
        stepNumber: 5,
        title: "Collect documentation",
        stepType: "manual",
        status: "completed",
        assignedTo: "user-gis-staff",
        evidenceRequired: true,
        completedAt: "2026-05-15T14:00:00.000Z",
        completedBy: "user-gis-staff",
      },
    ],
    audit: [
      {
        id: "audit-enrol-t1-completed",
        eventType: "workflow.completed",
        actorId: "user-gis-owner",
        actorName: "Michael Darko",
        action: "Completed workflow Enrol New Student — Term 1",
        occurredAt: "2026-05-20T16:00:00.000Z",
      },
    ],
  });

  seedWorkflow({
    instance: {
      id: "workflow-gis-safeguarding-oct",
      tenantId: "tenant-gis",
      processId: "proc-gis-safeguarding",
      processVersionId: safeguardingVersionId,
      processName: "Manage Safeguarding Concern",
      processCode: "ADMN-SAF-001",
      title: "Safeguarding Review — October 2025",
      context: "Closed incident follow-up",
      status: "completed",
      startedBy: "user-gis-compliance",
      startedAt: "2026-05-10T09:00:00.000Z",
      completedAt: "2026-05-18T12:00:00.000Z",
    },
    taskRows: [
      {
        id: "workflow-gis-safeguarding-task-1",
        processStepId: `${safeguardingVersionId}-step-1`,
        stepNumber: 1,
        title: "Receive and log concern",
        stepType: "manual",
        status: "completed",
        assignedTo: "user-gis-compliance",
        evidenceRequired: false,
        completedAt: "2026-05-11T10:00:00.000Z",
        completedBy: "user-gis-compliance",
      },
      {
        id: "workflow-gis-safeguarding-task-4",
        processStepId: `${safeguardingVersionId}-step-4`,
        stepNumber: 4,
        title: "Close case with compliance sign-off",
        stepType: "manual",
        status: "completed",
        assignedTo: "user-gis-compliance",
        evidenceRequired: true,
        completedAt: "2026-05-18T12:00:00.000Z",
        completedBy: "user-gis-compliance",
      },
    ],
  });

  seedWorkflow({
    instance: {
      id: "workflow-gis-enrolment-t2",
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: enrolmentV3Id,
      processName: "Enrol New Student",
      processCode: "ADMN-ENR-001",
      title: "Enrol New Student — Term 2, 2025/26",
      context: "Term 2 intake",
      status: "in_progress",
      startedBy: "user-gis-owner",
      startedAt: "2026-05-27T09:00:00.000Z",
    },
    taskRows: [
      {
        id: "workflow-gis-enrolment-t2-task-1",
        processStepId: `${enrolmentV3Id}-step-1`,
        stepNumber: 1,
        title: "Receive application",
        stepType: "manual",
        status: "completed",
        assignedTo: "user-gis-staff",
        evidenceRequired: false,
        completedAt: "2026-05-27T10:00:00.000Z",
        completedBy: "user-gis-staff",
      },
      {
        id: "workflow-gis-enrolment-t2-task-2",
        processStepId: `${enrolmentV3Id}-step-2`,
        stepNumber: 2,
        title: "Conduct interview",
        stepType: "approval",
        status: "completed",
        assignedTo: "user-gis-head",
        evidenceRequired: false,
        completedAt: "2026-05-27T10:30:00.000Z",
        completedBy: "user-gis-head",
      },
      {
        id: "workflow-gis-enrolment-t2-task-3",
        processStepId: `${enrolmentV3Id}-step-3`,
        stepNumber: 3,
        title: "Safeguarding review",
        stepType: "approval",
        status: "in_progress",
        assignedTo: "user-gis-staff",
        evidenceRequired: false,
        startedAt: "2026-05-27T11:00:00.000Z",
      },
      {
        id: "workflow-gis-enrolment-t2-task-4",
        processStepId: `${enrolmentV3Id}-step-4`,
        stepNumber: 4,
        title: "Confirm placement",
        stepType: "approval",
        status: "pending",
        assignedTo: "user-gis-head",
        evidenceRequired: false,
      },
      {
        id: "workflow-gis-enrolment-t2-task-5",
        processStepId: `${enrolmentV3Id}-step-5`,
        stepNumber: 5,
        title: "Collect documentation",
        stepType: "manual",
        status: "pending",
        assignedTo: "user-gis-staff",
        evidenceRequired: true,
      },
      {
        id: "workflow-gis-enrolment-t2-task-6",
        processStepId: `${enrolmentV3Id}-step-6`,
        stepNumber: 6,
        title: "Verify fee payment clearance",
        stepType: "manual",
        status: "pending",
        assignedTo: "user-gis-owner",
        evidenceRequired: false,
      },
      {
        id: "workflow-gis-enrolment-t2-task-7",
        processStepId: `${enrolmentV3Id}-step-7`,
        stepNumber: 7,
        title: "Create student record in SIS",
        stepType: "manual",
        status: "pending",
        assignedTo: "user-gis-staff",
        evidenceRequired: false,
      },
    ],
    audit: [
      {
        id: "audit-enrol-t2-started",
        eventType: "workflow.started",
        actorId: "user-gis-owner",
        actorName: "Michael Darko",
        action: "Started workflow",
        occurredAt: "2026-05-27T09:00:00.000Z",
      },
      {
        id: "audit-enrol-t2-task1",
        eventType: "workflow.task_completed",
        actorId: "user-gis-staff",
        actorName: "Grace Osei",
        action: "Completed task Receive and review application",
        metadata: { taskId: "workflow-gis-enrolment-t2-task-1" },
        occurredAt: "2026-05-27T10:00:00.000Z",
      },
    ],
  });

  seedWorkflow({
    instance: {
      id: "workflow-gis-evidence-demo",
      tenantId: "tenant-gis",
      processId: "proc-gis-enrolment",
      processVersionId: enrolmentV3Id,
      processName: "Enrol New Student",
      title: "Evidence demo workflow",
      status: "in_progress",
      startedBy: "user-gis-owner",
      startedAt: "2026-05-28T09:00:00.000Z",
    },
    taskRows: [
      {
        id: "workflow-gis-evidence-demo-task-1",
        stepNumber: 1,
        title: "Upload compliance evidence",
        stepType: "manual",
        status: "in_progress",
        assignedTo: "user-gis-staff",
        evidenceRequired: true,
        startedAt: "2026-05-28T09:05:00.000Z",
      },
    ],
  });

  seedWorkflow({
    instance: {
      id: "workflow-gis-fees-q1",
      tenantId: "tenant-gis",
      processId: "proc-gis-fees",
      processVersionId: "proc-gis-fees-v1",
      processName: "Process Fee Payment",
      title: "Fee payment — Q1 2025",
      status: "completed",
      startedBy: "user-gis-owner",
      startedAt: "2026-05-01T09:00:00.000Z",
      completedAt: "2026-05-10T16:00:00.000Z",
    },
    taskRows: [
      {
        id: "workflow-gis-fees-q1-task-1",
        stepNumber: 1,
        title: "Verify fee schedule against enrolment",
        stepType: "manual",
        status: "completed",
        assignedTo: "user-gis-owner",
        evidenceRequired: false,
        completedAt: "2026-05-05T10:00:00.000Z",
        completedBy: "user-gis-owner",
      },
    ],
  });
}

buildInitialStore();

export class WorkflowDemoStore {
  listInstances(tenantId: string, filters: { status?: string; processId?: string; startedBy?: string } = {}) {
    return [...instances.values()]
      .filter((item) => item.tenantId === tenantId)
      .filter((item) => !filters.status || item.status === filters.status)
      .filter((item) => !filters.processId || item.processId === filters.processId)
      .filter((item) => !filters.startedBy || item.startedBy === filters.startedBy)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  getInstance(tenantId: string, id: string) {
    const instance = instances.get(id);
    if (!instance || instance.tenantId !== tenantId) {
      return null;
    }
    return instance;
  }

  createInstance(input: Omit<WorkflowInstanceRecord, "id">) {
    const id = randomUUID();
    instances.set(id, { ...input, id });
    return instances.get(id)!;
  }

  listTasks(workflowInstanceId: string) {
    return [...tasks.values()]
      .filter((task) => task.workflowInstanceId === workflowInstanceId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  listMyTasks(tenantId: string, userId: string) {
    return [...tasks.values()]
      .filter(
        (task) =>
          task.tenantId === tenantId &&
          task.assignedTo === userId &&
          (task.status === "pending" || task.status === "in_progress"),
      )
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }

  getTask(tenantId: string, workflowInstanceId: string, taskId: string) {
    const task = tasks.get(taskId);
    if (
      !task ||
      task.tenantId !== tenantId ||
      task.workflowInstanceId !== workflowInstanceId
    ) {
      return null;
    }
    return task;
  }

  updateTask(taskId: string, patch: Partial<WorkflowTaskRecord>) {
    const existing = tasks.get(taskId);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    tasks.set(taskId, updated);
    return updated;
  }

  updateInstance(instanceId: string, patch: Partial<WorkflowInstanceRecord>) {
    const existing = instances.get(instanceId);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    instances.set(instanceId, updated);
    return updated;
  }

  addTask(input: Omit<WorkflowTaskRecord, "id">) {
    const id = randomUUID();
    const row = { ...input, id };
    tasks.set(id, row);
    return row;
  }

  appendAudit(input: Omit<WorkflowAuditRecord, "id">) {
    const id = randomUUID();
    const row = { ...input, id };
    auditEvents.set(id, row);
    return row;
  }

  listAudit(workflowInstanceId: string) {
    return [...auditEvents.values()]
      .filter((event) => event.workflowInstanceId === workflowInstanceId)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  createTasksFromSteps(
    tenantId: string,
    workflowInstanceId: string,
    steps: ProcessStepRecord[],
    assignees: Map<string, string>,
  ) {
    return steps.map((step, index) => {
      const assignedTo = assignees.get(step.id);
      const status = index === 0 ? "in_progress" : "pending";
      return this.addTask({
        tenantId,
        workflowInstanceId,
        processStepId: step.id,
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        stepType: step.stepType === "approval" ? "approval" : "manual",
        status: status as WorkflowTaskStatus,
        assignedTo,
        evidenceRequired: step.evidenceRequired,
        startedAt: index === 0 ? new Date().toISOString() : undefined,
      });
    });
  }

  resolveProcessSteps(processVersionId: string) {
    return processDemoStore
      .listSteps(processVersionId)
      .sort((a, b) => a.stepNumber - b.stepNumber);
  }
}

export const workflowDemoStore = new WorkflowDemoStore();

export function resetWorkflowDemoStore() {
  buildInitialStore();
}
