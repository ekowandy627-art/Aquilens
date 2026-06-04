import { Inject, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { processDemoStore } from "../processes/process-demo.store";
import { WorkflowEngineService } from "../workflows/workflow-engine.service";
import { workflowDemoStore } from "../workflows/workflow-demo.store";
import { siaiDemoStore } from "./siai-demo.store";

@Injectable()
export class SiaiService {
  constructor(
    @Inject(WorkflowEngineService)
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  list(user: AuthUser) {
    return siaiDemoStore.list(user.tenantId).map((row) => ({
      id: row.id,
      siaiCode: row.siaiCode,
      title: row.title,
      category: row.category,
      severity: row.severity,
      status: row.status,
      loggedAt: row.loggedAt,
    }));
  }

  getDetail(user: AuthUser, id: string) {
    const row = siaiDemoStore.get(user.tenantId, id);
    if (!row) {
      return null;
    }
    return {
      ...row,
      derivedStatus: this.deriveStatus(row),
    };
  }

  async create(
    user: AuthUser,
    input: {
      title: string;
      description: string;
      category: string;
      severity: "critical" | "high" | "medium" | "low";
      linkedProcessId?: string;
    },
  ) {
    const process = input.linkedProcessId
      ? processDemoStore.getProcess(user.tenantId, input.linkedProcessId)
      : null;

    const record = siaiDemoStore.create({
      tenantId: user.tenantId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      severity: input.severity,
      linkedProcessId: input.linkedProcessId,
      loggedBy: user.id,
      loggedAt: new Date().toISOString(),
    });

    const workflow = await this.workflowEngine.trigger(user, "siai_created", {
      siaiId: record.id,
      processId: process?.id,
      processVersionId: process?.currentVersionId,
      processName: process?.name ?? record.title,
      assigneeId: "user-gis-compliance",
      signOffAssigneeId: "user-gis-head",
      raiserId: user.id,
    });

    siaiDemoStore.update(record.id, {
      linkedWorkflowInstanceId: workflow.id,
    });

    return this.getDetail(user, record.id);
  }

  async openResolution(user: AuthUser, siaiId: string) {
    if (!user.roles.includes("Compliance Officer") && !user.roles.includes("Super Admin")) {
      throw new Error("Only Compliance Officers can manually open resolution workflows.");
    }

    const row = siaiDemoStore.get(user.tenantId, siaiId);
    if (!row) {
      return null;
    }

    const process = row.linkedProcessId
      ? processDemoStore.getProcess(user.tenantId, row.linkedProcessId)
      : null;

    const workflow = await this.workflowEngine.trigger(user, "siai_created", {
      siaiId: row.id,
      processId: process?.id,
      processVersionId: process?.currentVersionId,
      processName: process?.name ?? row.title,
      assigneeId: user.id,
      signOffAssigneeId: "user-gis-head",
      raiserId: row.loggedBy,
    });

    siaiDemoStore.update(row.id, { linkedWorkflowInstanceId: workflow.id });
    return { workflowId: workflow.id };
  }

  private deriveStatus(row: NonNullable<ReturnType<typeof siaiDemoStore.get>>) {
    if (!row.linkedWorkflowInstanceId) {
      return "open";
    }
    const tasks = workflowDemoStore.listTasks(row.linkedWorkflowInstanceId);
    const signOff = tasks.find((task) => task.title.includes("sign-off"));
    if (signOff?.status === "completed" || signOff?.status === "approved") {
      if (signOff.completedBy === row.loggedBy) {
        return "open";
      }
      return "closed";
    }
    return "resolution_in_progress";
  }
}
