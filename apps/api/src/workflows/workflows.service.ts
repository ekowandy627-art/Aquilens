import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { processDemoStore } from "../processes/process-demo.store";
import { EvidenceService } from "../evidence/evidence.service";
import { EvidenceError } from "../evidence/evidence.errors";
import {
  WorkflowExecutionError,
  allTasksDone,
  assertCanActOnTask,
  assertPreviousTaskComplete,
  countCompletedTasks,
  isTaskDone,
  type WorkflowTaskStatus,
} from "./workflow-execution";
import { workflowDemoStore } from "./workflow-demo.store";
import type {
  WorkflowTriggerContext,
  WorkflowTriggerType,
} from "./workflow-engine.types";
import { createResolutionWorkflow } from "./resolution-workflow";

export { WorkflowExecutionError, EvidenceError };

type WorkflowTaskForExecution = {
  id: string;
  stepNumber: number;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "skipped"
    | "approved"
    | "rejected";
  stepType: string;
  assignedTo?: string;
  evidenceRequired: boolean;
};

type WorkflowTaskRecord = ReturnType<WorkflowsService["toTaskRecord"]>;

type StartWorkflowInput = {
  processId: string;
  title: string;
  context?: string;
  assignees?: Array<{ stepId: string; userId: string }>;
};

type WorkflowListFilters = {
  status?: string;
  processId?: string;
  startedBy?: string;
};

@Injectable()
export class WorkflowsService {
  constructor(
    @Inject(EvidenceService) private readonly evidence: EvidenceService,
  ) {}

  async list(user: AuthUser, filters: WorkflowListFilters = {}) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return workflowDemoStore
        .listInstances(user.tenantId, filters)
        .map((instance) => this.toWorkflowSummary(instance));
    }

    let query = supabase
      .from("workflow_instances")
      .select("*")
      .eq("tenant_id", user.tenantId);

    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.processId) {
      query = query.eq("process_id", filters.processId);
    }
    if (filters.startedBy) {
      query = query.eq("started_by", filters.startedBy);
    }

    const { data, error } = await query.order("started_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toWorkflowSummaryFromRow(row));
  }

  async listMyTasks(user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return workflowDemoStore.listMyTasks(user.tenantId, user.id).map((task) => {
        const instance = workflowDemoStore.getInstance(user.tenantId, task.workflowInstanceId);
        return {
          ...this.toTaskRecord(task),
          workflowId: task.workflowInstanceId,
          workflowTitle: instance?.title ?? "Workflow",
          workflowStatus: instance?.status ?? "in_progress",
          processId: instance?.processId,
          processName: instance?.processName,
        };
      });
    }

    const { data, error } = await supabase
      .from("workflow_tasks")
      .select("*, workflow_instances(title, status, process_id)")
      .eq("tenant_id", user.tenantId)
      .eq("assigned_to", user.id)
      .in("status", ["pending", "in_progress"])
      .order("step_number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      ...this.toTaskRecordFromRow(row),
      workflowId: row.workflow_instance_id as string,
      workflowTitle:
        (row.workflow_instances as { title?: string } | null)?.title ?? "Workflow",
      workflowStatus:
        (row.workflow_instances as { status?: string } | null)?.status ?? "in_progress",
      processId: (row.workflow_instances as { process_id?: string } | null)?.process_id,
      processName: undefined,
    }));
  }

  async get(user: AuthUser, workflowId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const instance = workflowDemoStore.getInstance(user.tenantId, workflowId);
      if (!instance) {
        return null;
      }
      const tasks = workflowDemoStore.listTasks(workflowId);
      return {
        ...this.toWorkflowDetail(instance, tasks),
        tasks: tasks.map((task) => this.toTaskRecord(task)),
      };
    }

    const { data: instance, error } = await supabase
      .from("workflow_instances")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", workflowId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!instance) {
      return null;
    }

    const { data: tasks } = await supabase
      .from("workflow_tasks")
      .select("*")
      .eq("workflow_instance_id", workflowId)
      .order("step_number", { ascending: true });

    const mappedTasks = (tasks ?? []).map((task) => this.toTaskRecordFromRow(task));
    return {
      ...this.toWorkflowDetailFromRow(instance, mappedTasks),
      tasks: mappedTasks,
    };
  }

  async startApprovalWorkflow(
    user: AuthUser,
    context: WorkflowTriggerContext,
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const process = processDemoStore.getProcess(
        user.tenantId,
        context.processId ?? "",
      );
      if (!process || !context.processId) {
        throw new WorkflowExecutionError("NOT_FOUND", "Process not found.");
      }

      const approverId =
        context.approverId ??
        processDemoStore.resolveApprover(process.currentVersionId);
      const now = new Date().toISOString();
      const instance = workflowDemoStore.createInstance({
        tenantId: user.tenantId,
        processId: process.id,
        processVersionId: process.currentVersionId,
        processName: process.name,
        processCode: process.processCode,
        title: `Approve SOP: ${process.name}`,
        context: `trigger:sop_submitted_for_approval;approval:${context.approvalId ?? ""}`,
        status: "in_progress",
        startedBy: user.id,
        startedAt: now,
      });

      const tasks = [
        workflowDemoStore.addTask({
          tenantId: user.tenantId,
          workflowInstanceId: instance.id,
          processStepId: `${process.currentVersionId}-approval-review`,
          stepNumber: 1,
          title: "Review and approve SOP publication",
          stepType: "approval",
          status: "in_progress",
          assignedTo: approverId,
          evidenceRequired: false,
          startedAt: now,
        }),
      ];

      workflowDemoStore.appendAudit({
        workflowInstanceId: instance.id,
        eventType: "workflow.triggered",
        actorId: user.id,
        actorName: user.email,
        action: `System started approval workflow for "${process.name}"`,
        occurredAt: now,
      });

      return {
        ...this.toWorkflowDetail(instance, tasks),
        tasks: tasks.map((task) => this.toTaskRecord(task)),
        trigger: "sop_submitted_for_approval" as const,
      };
    }

    throw new WorkflowExecutionError(
      "NOT_IMPLEMENTED",
      "Approval workflow trigger requires demo mode in this sprint.",
    );
  }

  async startResolutionWorkflow(
    user: AuthUser,
    trigger: Extract<WorkflowTriggerType, "incident_logged" | "siai_created">,
    context: WorkflowTriggerContext,
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const entityRef =
        trigger === "incident_logged"
          ? `incident:${context.incidentId}`
          : `siai:${context.siaiId}`;
      const title =
        trigger === "incident_logged"
          ? `Resolve incident: ${context.processName ?? context.incidentId}`
          : `Resolve SIAI: ${context.processName ?? context.siaiId}`;

      const { instance, tasks } = createResolutionWorkflow(user, {
        title,
        trigger,
        processId: context.processId,
        processVersionId: context.processVersionId,
        processName: context.processName ?? "Resolution",
        assigneeId: context.assigneeId ?? user.id,
        signOffAssigneeId: context.signOffAssigneeId ?? "user-gis-head",
        entityRef,
      });

      return {
        ...this.toWorkflowDetail(instance, tasks),
        tasks: tasks.map((task) => this.toTaskRecord(task)),
        trigger,
        raiserId: context.raiserId,
      };
    }

    throw new WorkflowExecutionError(
      "NOT_IMPLEMENTED",
      "Resolution workflow trigger requires demo mode in this sprint.",
    );
  }

  async startAttestationWorkflow(user: AuthUser, context: WorkflowTriggerContext) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const now = new Date().toISOString();
      const instance = workflowDemoStore.createInstance({
        tenantId: user.tenantId,
        processId: context.agentId ?? "agent-attestation",
        processVersionId: "agent-attestation-v1",
        processName: context.agentName ?? "Agent attestation",
        title: `Attest agent: ${context.agentName ?? context.agentId}`,
        context: `trigger:agent_attestation_due;agent:${context.agentId}`,
        status: "in_progress",
        startedBy: user.id,
        startedAt: now,
      });

      const task = workflowDemoStore.addTask({
        tenantId: user.tenantId,
        workflowInstanceId: instance.id,
        processStepId: `${context.agentId}-attestation`,
        stepNumber: 1,
        title: "Complete agent attestation review",
        stepType: "approval",
        status: "in_progress",
        assignedTo: context.assigneeId ?? user.id,
        evidenceRequired: false,
        startedAt: now,
      });

      workflowDemoStore.appendAudit({
        workflowInstanceId: instance.id,
        eventType: "workflow.triggered",
        actorId: user.id,
        actorName: user.email,
        action: `Attestation due workflow for ${context.agentName ?? context.agentId}`,
        occurredAt: now,
      });

      return {
        ...this.toWorkflowDetail(instance, [task]),
        tasks: [this.toTaskRecord(task)],
        trigger: "agent_attestation_due" as const,
      };
    }

    throw new WorkflowExecutionError(
      "NOT_IMPLEMENTED",
      "Attestation workflow trigger requires demo mode.",
    );
  }

  async start(_user: AuthUser, _input: StartWorkflowInput) {
    throw new WorkflowExecutionError(
      "MANUAL_START_DISABLED",
      "Manual workflow start is disabled. Workflows are created by system triggers (e.g. SOP submitted for approval).",
    );
  }

  async updateMetadata(
    user: AuthUser,
    workflowId: string,
    patch: { title?: string; context?: string },
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const instance = workflowDemoStore.getInstance(user.tenantId, workflowId);
      if (!instance) {
        return null;
      }
      return workflowDemoStore.updateInstance(workflowId, {
        title: patch.title?.trim() ?? instance.title,
        context: patch.context?.trim() ?? instance.context,
      });
    }

    const { data, error } = await supabase
      .from("workflow_instances")
      .update({
        title: patch.title?.trim(),
        context: patch.context?.trim(),
      })
      .eq("tenant_id", user.tenantId)
      .eq("id", workflowId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async cancel(user: AuthUser, workflowId: string, reason: string) {
    if (!reason?.trim()) {
      throw new WorkflowExecutionError(
        "INVALID_STATE",
        "Cancellation reason is required.",
      );
    }

    const supabase = getSupabaseAdminClient();
    const now = new Date().toISOString();

    if (!supabase) {
      const instance = workflowDemoStore.getInstance(user.tenantId, workflowId);
      if (!instance) {
        throw new WorkflowExecutionError("NOT_FOUND", "Workflow not found.");
      }
      if (instance.status === "cancelled") {
        throw new WorkflowExecutionError("WORKFLOW_CANCELLED", "Workflow is cancelled.");
      }

      workflowDemoStore.updateInstance(workflowId, {
        status: "cancelled",
        cancelledAt: now,
        cancellationReason: reason.trim(),
      });

      workflowDemoStore.appendAudit({
        workflowInstanceId: workflowId,
        eventType: "workflow.cancelled",
        actorId: user.id,
        actorName: user.email,
        action: "Cancelled workflow",
        metadata: { reason: reason.trim() },
        occurredAt: now,
      });

      return workflowDemoStore.getInstance(user.tenantId, workflowId);
    }

    await supabase
      .from("workflow_instances")
      .update({
        status: "cancelled",
        cancelled_at: now,
        cancellation_reason: reason.trim(),
      })
      .eq("tenant_id", user.tenantId)
      .eq("id", workflowId);

    return this.get(user, workflowId);
  }

  async listTasks(user: AuthUser, workflowId: string) {
    const detail = await this.get(user, workflowId);
    if (!detail) {
      throw new WorkflowExecutionError("NOT_FOUND", "Workflow not found.");
    }
    return detail.tasks;
  }

  async getTask(user: AuthUser, workflowId: string, taskId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const task = workflowDemoStore.getTask(user.tenantId, workflowId, taskId);
      return task ? this.toTaskRecord(task) : null;
    }

    const { data } = await supabase
      .from("workflow_tasks")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("workflow_instance_id", workflowId)
      .eq("id", taskId)
      .maybeSingle();

    return data ? this.toTaskRecordFromRow(data) : null;
  }

  async startTask(user: AuthUser, workflowId: string, taskId: string) {
    return this.transitionTask(user, workflowId, taskId, "start");
  }

  async completeTask(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    notes?: string,
  ) {
    return this.transitionTask(user, workflowId, taskId, "complete", {
      notes,
      terminalStatus: "completed",
    });
  }

  async skipTask(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    reason: string,
  ) {
    if (!reason?.trim()) {
      throw new WorkflowExecutionError("INVALID_STATE", "Skip reason is required.");
    }

    return this.transitionTask(user, workflowId, taskId, "skip", {
      skipReason: reason.trim(),
      terminalStatus: "skipped",
    });
  }

  async approveTask(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    notes?: string,
  ) {
    const task = await this.requireTask(user, workflowId, taskId);
    if (task.stepType !== "approval") {
      throw new WorkflowExecutionError(
        "INVALID_TASK_TYPE",
        "Only approval tasks can be approved.",
      );
    }

    return this.transitionTask(user, workflowId, taskId, "approve", {
      notes,
      terminalStatus: "approved",
    });
  }

  async rejectTask(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    comment: string,
  ) {
    if (!comment?.trim()) {
      throw new WorkflowExecutionError("INVALID_STATE", "Rejection comment is required.");
    }

    const task = await this.requireTask(user, workflowId, taskId);
    if (task.stepType !== "approval") {
      throw new WorkflowExecutionError(
        "INVALID_TASK_TYPE",
        "Only approval tasks can be rejected.",
      );
    }

    return this.transitionTask(user, workflowId, taskId, "reject", {
      notes: comment.trim(),
      terminalStatus: "rejected",
    });
  }

  async listAudit(user: AuthUser, workflowId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const instance = workflowDemoStore.getInstance(user.tenantId, workflowId);
      if (!instance) {
        throw new WorkflowExecutionError("NOT_FOUND", "Workflow not found.");
      }
      return workflowDemoStore.listAudit(workflowId);
    }

    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .contains("metadata", { workflowId })
      .order("created_at", { ascending: true });

    if (error) {
      return workflowDemoStore.listAudit(workflowId);
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      eventType: row.event_type as string,
      actorId: (row.actor_id as string) ?? undefined,
      actorName: (row.actor_name as string) ?? undefined,
      action: row.action as string,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
      occurredAt: row.created_at as string,
    }));
  }

  private async requireTask(user: AuthUser, workflowId: string, taskId: string) {
    const task = await this.getTask(user, workflowId, taskId);
    if (!task) {
      throw new WorkflowExecutionError("NOT_FOUND", "Task not found.");
    }
    return task;
  }

  private async loadTaskRow(user: AuthUser, workflowId: string, taskId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return workflowDemoStore.getTask(user.tenantId, workflowId, taskId);
    }

    const { data } = await supabase
      .from("workflow_tasks")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("workflow_instance_id", workflowId)
      .eq("id", taskId)
      .maybeSingle();

    return data;
  }

  private async transitionTask(
    user: AuthUser,
    workflowId: string,
    taskId: string,
    action: "start" | "complete" | "skip" | "approve" | "reject",
    options: {
      notes?: string;
      skipReason?: string;
      terminalStatus?: "completed" | "skipped" | "approved" | "rejected";
    } = {},
  ) {
    const supabase = getSupabaseAdminClient();
    const instance = supabase
      ? await this.get(user, workflowId)
      : workflowDemoStore.getInstance(user.tenantId, workflowId);

    if (!instance) {
      throw new WorkflowExecutionError("NOT_FOUND", "Workflow not found.");
    }

    const workflowStatus = (instance as { status: string }).status;

    if (workflowStatus === "cancelled") {
      throw new WorkflowExecutionError("WORKFLOW_CANCELLED", "Workflow is cancelled.");
    }

    const tasks: WorkflowTaskForExecution[] = supabase
      ? (instance as { tasks: WorkflowTaskForExecution[] }).tasks
      : workflowDemoStore.listTasks(workflowId);

    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    const task = tasks[taskIndex];
    if (!task) {
      throw new WorkflowExecutionError("NOT_FOUND", "Task not found.");
    }

    assertCanActOnTask(
      (task as { assignedTo?: string }).assignedTo,
      user.id,
      user.permissions,
    );

    if (action === "start") {
      assertPreviousTaskComplete(tasks, taskIndex);
      if (task.status !== "pending") {
        throw new WorkflowExecutionError(
          "INVALID_STATE",
          "Only pending tasks can be started.",
        );
      }
    } else {
      assertPreviousTaskComplete(tasks, taskIndex);
      if (task.status !== "in_progress" && task.status !== "pending") {
        throw new WorkflowExecutionError(
          "INVALID_STATE",
          "Task is not actionable.",
        );
      }

      const evidenceRequired = Boolean(
        (task as { evidenceRequired?: boolean }).evidenceRequired,
      );

      if (
        (action === "complete" || action === "approve" || action === "reject") &&
        evidenceRequired
      ) {
        await this.evidence.assertEvidencePresentIfRequired(
          user,
          workflowId,
          taskId,
          evidenceRequired,
        );
      }
    }

    const now = new Date().toISOString();

    if (!supabase) {
      const demoTask = workflowDemoStore.getTask(user.tenantId, workflowId, taskId)!;

      if (action === "start") {
        workflowDemoStore.updateTask(taskId, {
          status: "in_progress",
          startedAt: now,
        });
      } else {
        workflowDemoStore.updateTask(taskId, {
          status: options.terminalStatus ?? "completed",
          completedAt: now,
          completedBy: user.id,
          notes: options.notes?.trim() || demoTask.notes,
          skipReason: options.skipReason,
        });

        const refreshedTasks = workflowDemoStore.listTasks(workflowId);
        const next = refreshedTasks.find((row) => row.status === "pending");
        if (next) {
          workflowDemoStore.updateTask(next.id, {
            status: "in_progress",
            startedAt: now,
          });
        }

        if (allTasksDone(workflowDemoStore.listTasks(workflowId))) {
          workflowDemoStore.updateInstance(workflowId, {
            status: "completed",
            completedAt: now,
          });
        }

        workflowDemoStore.appendAudit({
          workflowInstanceId: workflowId,
          eventType: `workflow.task_${options.terminalStatus ?? "completed"}`,
          actorId: user.id,
          actorName: user.email,
          action: `${action} task ${demoTask.title}`,
          metadata: { taskId, notes: options.notes, skipReason: options.skipReason },
          occurredAt: now,
        });
      }

      return this.toTaskRecord(workflowDemoStore.getTask(user.tenantId, workflowId, taskId)!);
    }

    if (action === "start") {
      await supabase
        .from("workflow_tasks")
        .update({ status: "in_progress", started_at: now })
        .eq("id", taskId);
    } else {
      await supabase
        .from("workflow_tasks")
        .update({
          status: options.terminalStatus ?? "completed",
          completed_at: now,
          completed_by: user.id,
          notes: options.notes?.trim() ?? null,
          skip_reason: options.skipReason ?? null,
        })
        .eq("id", taskId);

      const { data: nextTask } = await supabase
        .from("workflow_tasks")
        .select("id")
        .eq("workflow_instance_id", workflowId)
        .eq("status", "pending")
        .order("step_number", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextTask?.id) {
        await supabase
          .from("workflow_tasks")
          .update({ status: "in_progress", started_at: now })
          .eq("id", nextTask.id);
      } else {
        await supabase
          .from("workflow_instances")
          .update({ status: "completed", completed_at: now })
          .eq("id", workflowId);
      }
    }

    const updated = await this.getTask(user, workflowId, taskId);
    return updated!;
  }

  private toWorkflowSummary(instance: {
    id: string;
    title: string;
    processName: string;
    processCode?: string;
    processId: string;
    status: string;
    startedBy: string;
    startedAt: string;
    completedAt?: string;
  }) {
    const tasks = workflowDemoStore.listTasks(instance.id);
    return {
      id: instance.id,
      title: instance.title,
      processId: instance.processId,
      processName: instance.processName,
      processCode: instance.processCode,
      status: instance.status,
      startedBy: instance.startedBy,
      startedAt: instance.startedAt,
      completedAt: instance.completedAt,
      tasksCompleted: countCompletedTasks(tasks),
      tasksTotal: tasks.length,
    };
  }

  private toWorkflowSummaryFromRow(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      title: row.title as string,
      processId: row.process_id as string,
      processName: "Process",
      status: row.status as string,
      startedBy: (row.started_by as string) ?? "",
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string) ?? undefined,
      tasksCompleted: 0,
      tasksTotal: 0,
    };
  }

  private toWorkflowDetail(
    instance: {
      id: string;
      title: string;
      processId: string;
      processVersionId: string;
      processName: string;
      processCode?: string;
      context?: string;
      status: "in_progress" | "completed" | "cancelled";
      startedBy: string;
      startedAt: string;
      completedAt?: string;
      cancelledAt?: string;
      cancellationReason?: string;
    },
    tasks: Array<{
      status:
        | "pending"
        | "in_progress"
        | "completed"
        | "skipped"
        | "approved"
        | "rejected";
    }>,
  ) {
    return {
      id: instance.id,
      title: instance.title,
      processId: instance.processId,
      processVersionId: instance.processVersionId,
      processName: instance.processName,
      processCode: instance.processCode,
      context: instance.context,
      status: instance.status,
      startedBy: instance.startedBy,
      startedAt: instance.startedAt,
      completedAt: instance.completedAt,
      cancelledAt: instance.cancelledAt,
      cancellationReason: instance.cancellationReason,
      tasksCompleted: countCompletedTasks(tasks),
      tasksTotal: tasks.length,
    };
  }

  private toWorkflowDetailFromRow(
    row: Record<string, unknown>,
    tasks: WorkflowTaskRecord[],
  ) {
    return {
      id: row.id as string,
      title: row.title as string,
      processId: row.process_id as string,
      processVersionId: row.process_version_id as string,
      processName: "Process",
      context: (row.context as string) ?? undefined,
      status: row.status as string,
      startedBy: (row.started_by as string) ?? "",
      startedAt: row.started_at as string,
      completedAt: (row.completed_at as string) ?? undefined,
      cancelledAt: (row.cancelled_at as string) ?? undefined,
      cancellationReason: (row.cancellation_reason as string) ?? undefined,
      tasksCompleted: countCompletedTasks(tasks),
      tasksTotal: tasks.length,
    };
  }

  private toTaskRecord(task: {
    id: string;
    workflowInstanceId: string;
    processStepId?: string;
    stepNumber: number;
    title: string;
    description?: string;
    stepType: string;
    status: WorkflowTaskStatus;
    assignedTo?: string;
    assignedRole?: string;
    evidenceRequired: boolean;
    startedAt?: string;
    completedAt?: string;
    completedBy?: string;
    notes?: string;
    skipReason?: string;
  }) {
    return {
      id: task.id,
      workflowInstanceId: task.workflowInstanceId,
      processStepId: task.processStepId,
      stepNumber: task.stepNumber,
      title: task.title,
      description: task.description,
      stepType: task.stepType,
      status: task.status as WorkflowTaskStatus,
      assignedTo: task.assignedTo,
      assignedRole: task.assignedRole,
      evidenceRequired: task.evidenceRequired,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      completedBy: task.completedBy,
      notes: task.notes,
      skipReason: task.skipReason,
      isDone: isTaskDone(task.status),
    };
  }

  private toTaskRecordFromRow(row: Record<string, unknown>) {
    const status = row.status as WorkflowTaskStatus;
    return {
      id: row.id as string,
      workflowInstanceId: row.workflow_instance_id as string,
      processStepId: (row.process_step_id as string) ?? undefined,
      stepNumber: row.step_number as number,
      title: row.title as string,
      description: (row.description as string) ?? undefined,
      stepType: row.step_type as string,
      status,
      assignedTo: (row.assigned_to as string) ?? undefined,
      assignedRole: (row.assigned_role as string) ?? undefined,
      evidenceRequired: Boolean(row.evidence_required),
      startedAt: (row.started_at as string) ?? undefined,
      completedAt: (row.completed_at as string) ?? undefined,
      completedBy: (row.completed_by as string) ?? undefined,
      notes: (row.notes as string) ?? undefined,
      skipReason: (row.skip_reason as string) ?? undefined,
      isDone: isTaskDone(status as never),
    };
  }
}
