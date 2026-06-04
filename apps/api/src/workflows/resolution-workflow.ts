import type { AuthUser } from "../auth/auth.types";
import { workflowDemoStore } from "./workflow-demo.store";
import type { WorkflowInstanceRecord, WorkflowTaskRecord } from "./workflow-demo.store";

export type ResolutionWorkflowInput = {
  title: string;
  trigger: string;
  processId?: string;
  processVersionId?: string;
  processName: string;
  processCode?: string;
  assigneeId: string;
  signOffAssigneeId: string;
  entityRef: string;
};

export function createResolutionWorkflow(
  user: AuthUser,
  input: ResolutionWorkflowInput,
): { instance: WorkflowInstanceRecord; tasks: WorkflowTaskRecord[] } {
  const now = new Date().toISOString();
  const instance = workflowDemoStore.createInstance({
    tenantId: user.tenantId,
    processId: input.processId ?? "resolution-generic",
    processVersionId: input.processVersionId ?? "resolution-generic-v1",
    processName: input.processName,
    processCode: input.processCode,
    title: input.title,
    context: `trigger:${input.trigger};entity:${input.entityRef}`,
    status: "in_progress",
    startedBy: user.id,
    startedAt: now,
  });

  const actionTask = workflowDemoStore.addTask({
    tenantId: user.tenantId,
    workflowInstanceId: instance.id,
    processStepId: `${input.entityRef}-action`,
    stepNumber: 1,
    title: "Complete corrective action with evidence",
    stepType: "manual",
    status: "in_progress",
    assignedTo: input.assigneeId,
    evidenceRequired: true,
    startedAt: now,
  });

  const signOffTask = workflowDemoStore.addTask({
    tenantId: user.tenantId,
    workflowInstanceId: instance.id,
    processStepId: `${input.entityRef}-signoff`,
    stepNumber: 2,
    title: "Senior sign-off (raiser cannot close)",
    stepType: "approval",
    status: "pending",
    assignedTo: input.signOffAssigneeId,
    evidenceRequired: false,
  });

  workflowDemoStore.appendAudit({
    workflowInstanceId: instance.id,
    eventType: "workflow.triggered",
    actorId: user.id,
    actorName: user.email,
    action: `Resolution workflow started for ${input.entityRef}`,
    occurredAt: now,
  });

  return { instance, tasks: [actionTask, signOffTask] };
}
