import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { processDemoStore } from "../processes/process-demo.store";
import { WorkflowEngineService } from "../workflows/workflow-engine.service";
import { workflowDemoStore } from "../workflows/workflow-demo.store";
import { incidentDemoStore } from "./incident-demo.store";

export class IncidentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "IncidentError";
  }
}

@Injectable()
export class IncidentsService {
  constructor(
    @Inject(WorkflowEngineService)
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  list(user: AuthUser, filters?: { status?: string }) {
    return incidentDemoStore.list(user.tenantId, filters).map((row) => {
      const actions = incidentDemoStore.listActions(row.id);
      return this.toSummary(row, this.deriveStatus(row, actions));
    });
  }

  getDetail(user: AuthUser, id: string) {
    const incident = incidentDemoStore.get(user.tenantId, id);
    if (!incident) {
      return null;
    }
    const actionRows = incidentDemoStore.listActions(id);
    const derivedStatus = this.deriveStatus(incident, actionRows);
    return {
      ...this.toSummary(incident, derivedStatus),
      description: incident.description,
      incidentType: incident.incidentType,
      linkedProcessId: incident.linkedProcessId,
      linkedWorkflowInstanceId: incident.linkedWorkflowInstanceId,
      loggedBy: incident.loggedBy,
      loggedAt: incident.loggedAt,
      derivedStatus,
      actions: actionRows,
    };
  }

  async create(
    user: AuthUser,
    input: {
      title: string;
      description: string;
      incidentType: string;
      severity: "critical" | "high" | "medium" | "low";
      linkedProcessId?: string;
      correctiveAction?: string;
    },
  ) {
    const process = input.linkedProcessId
      ? processDemoStore.getProcess(user.tenantId, input.linkedProcessId)
      : null;

    const incident = incidentDemoStore.create({
      tenantId: user.tenantId,
      title: input.title.trim(),
      description: input.description.trim(),
      incidentType: input.incidentType,
      severity: input.severity,
      linkedProcessId: input.linkedProcessId,
      loggedBy: user.id,
      loggedAt: new Date().toISOString(),
    });

    const workflow = await this.workflowEngine.trigger(user, "incident_logged", {
      incidentId: incident.id,
      processId: process?.id,
      processVersionId: process?.currentVersionId,
      processName: process?.name ?? incident.title,
      assigneeId: "user-gis-compliance",
      signOffAssigneeId: "user-gis-head",
      raiserId: user.id,
    });

    incidentDemoStore.update(incident.id, {
      linkedWorkflowInstanceId: workflow.id,
    });

    if (input.correctiveAction?.trim()) {
      incidentDemoStore.addAction({
        tenantId: user.tenantId,
        incidentId: incident.id,
        actionType: "corrective",
        description: input.correctiveAction.trim(),
        assignedTo: user.id,
      });
    }

    return this.getDetail(user, incident.id);
  }

  addAction(
    user: AuthUser,
    incidentId: string,
    input: {
      actionType: "corrective" | "preventive";
      description: string;
      assignedTo?: string;
      referenceUrls?: string[];
    },
  ) {
    const incident = incidentDemoStore.get(user.tenantId, incidentId);
    if (!incident) {
      return null;
    }
    const action = incidentDemoStore.addAction({
      tenantId: user.tenantId,
      incidentId,
      actionType: input.actionType,
      description: input.description.trim(),
      assignedTo: input.assignedTo,
      referenceUrls: input.referenceUrls ?? [],
    });
    return action;
  }

  completeAction(
    user: AuthUser,
    incidentId: string,
    actionId: string,
    input: {
      notes?: string;
      referenceUrls?: string[];
      evidenceFileIds?: string[];
    },
  ) {
    const incident = incidentDemoStore.get(user.tenantId, incidentId);
    if (!incident) {
      return null;
    }
    return incidentDemoStore.completeAction(actionId, {
      completedBy: user.id,
      evidenceNotes: input.notes,
      referenceUrls: input.referenceUrls,
      evidenceFileIds: input.evidenceFileIds ?? [],
    });
  }

  async openResolution(user: AuthUser, incidentId: string) {
    if (!user.roles.includes("Compliance Officer") && !user.roles.includes("Super Admin")) {
      throw new IncidentError(
        "FORBIDDEN",
        "Only Compliance Officers can manually open resolution workflows.",
      );
    }

    const incident = incidentDemoStore.get(user.tenantId, incidentId);
    if (!incident) {
      return null;
    }
    if (incident.linkedWorkflowInstanceId) {
      const existing = workflowDemoStore.getInstance(
        user.tenantId,
        incident.linkedWorkflowInstanceId,
      );
      if (existing) {
        return { workflowId: existing.id, reopened: false };
      }
    }

    const process = incident.linkedProcessId
      ? processDemoStore.getProcess(user.tenantId, incident.linkedProcessId)
      : null;

    const workflow = await this.workflowEngine.trigger(user, "incident_logged", {
      incidentId: incident.id,
      processId: process?.id,
      processVersionId: process?.currentVersionId,
      processName: process?.name ?? incident.title,
      assigneeId: user.id,
      signOffAssigneeId: "user-gis-head",
      raiserId: incident.loggedBy,
    });

    incidentDemoStore.update(incident.id, {
      linkedWorkflowInstanceId: workflow.id,
      status: "open",
    });

    return { workflowId: workflow.id, reopened: true };
  }

  private deriveStatus(
    incident: ReturnType<typeof incidentDemoStore.get>,
    actions: ReturnType<typeof incidentDemoStore.listActions>,
  ) {
    if (!incident) {
      return "unknown";
    }
    if (incident.status === "closed" || incident.closedAt) {
      return "closed";
    }

    const workflowId = incident.linkedWorkflowInstanceId;
    if (!workflowId) {
      return "open";
    }

    const tasks = workflowDemoStore.listTasks(workflowId);
    const signOff = tasks.find((task) => task.title.includes("sign-off"));
    if (signOff?.status === "completed" || signOff?.status === "approved") {
      if (signOff.completedBy && signOff.completedBy === incident.loggedBy) {
        return "open";
      }
      return "closed";
    }

    if (actions.some((action) => action.status !== "completed")) {
      return "action_required";
    }

    return "resolution_in_progress";
  }

  private toSummary(
    incident: NonNullable<ReturnType<typeof incidentDemoStore.get>>,
    derivedStatus?: string,
  ) {
    return {
      id: incident.id,
      incidentCode: incident.incidentCode,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      derivedStatus: derivedStatus ?? incident.status,
      linkedProcessId: incident.linkedProcessId,
      loggedAt: incident.loggedAt,
    };
  }
}
