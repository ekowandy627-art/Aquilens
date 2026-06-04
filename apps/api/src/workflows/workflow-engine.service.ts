import { Inject, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { WorkflowsService } from "./workflows.service";
import type {
  WorkflowTriggerContext,
  WorkflowTriggerType,
} from "./workflow-engine.types";

@Injectable()
export class WorkflowEngineService {
  constructor(
    @Inject(WorkflowsService)
    private readonly workflows: WorkflowsService,
  ) {}

  async trigger(
    user: AuthUser,
    trigger: WorkflowTriggerType,
    context: WorkflowTriggerContext,
  ) {
    switch (trigger) {
      case "sop_submitted_for_approval":
        return this.workflows.startApprovalWorkflow(user, context);
      case "incident_logged":
      case "siai_created":
        return this.workflows.startResolutionWorkflow(user, trigger, context);
      case "agent_attestation_due":
        return this.workflows.startAttestationWorkflow(user, context);
      default:
        throw new Error(`Unsupported workflow trigger: ${trigger}`);
    }
  }

  deriveInstanceStatus(
    tasks: Array<{ status: string }>,
  ): "in_progress" | "completed" | "cancelled" {
    if (tasks.every((task) => task.status === "completed")) {
      return "completed";
    }
    if (tasks.some((task) => task.status === "cancelled")) {
      return "cancelled";
    }
    return "in_progress";
  }
}
