import { Inject, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { AgentsService } from "../agents/agents.service";
import { incidentDemoStore } from "../incidents/incident-demo.store";
import { siaiDemoStore } from "../siai/siai-demo.store";
import { processDemoStore } from "../processes/process-demo.store";
import { trainingDemoStore } from "../training/training-demo.store";
import { WorkflowEngineService } from "../workflows/workflow-engine.service";
import { notificationDemoStore } from "../notifications/notification-demo.store";

@Injectable()
export class InternalCronService {
  constructor(
    @Inject(AgentsService) private readonly agents: AgentsService,
    @Inject(WorkflowEngineService) private readonly workflowEngine: WorkflowEngineService,
  ) {}

  async runAttestationDueCron(actor: AuthUser) {
    const dueAgents = await this.agents.listDueAttestation(actor);
    const started = [];
    for (const agent of dueAgents) {
      const workflow = await this.workflowEngine.trigger(actor, "agent_attestation_due", {
        agentId: agent.id,
        agentName: agent.name,
        assigneeId: "user-gis-compliance",
      });
      started.push({ agentId: agent.id, workflowId: workflow.id });
      notificationDemoStore.create({
        tenantId: actor.tenantId,
        userId: "user-gis-compliance",
        type: "attestation_due",
        title: "Agent attestation due",
        body: `${agent.name} requires attestation review.`,
        entityType: "agent",
        entityId: agent.id,
        entityName: agent.name,
      });
    }
    return { triggered: started.length, workflows: started };
  }

  computeReadinessScore(tenantId: string) {
    const processes = processDemoStore.listProcesses(tenantId);
    const active = processes.filter((row) => row.status === "active");
    const processesScore =
      processes.length === 0 ? 0 : active.length / processes.length;

    const assignments = trainingDemoStore.listAssignmentsForTenant(tenantId);
    const trainingScore =
      assignments.length === 0
        ? 1
        : assignments.filter((row) => row.status === "completed").length /
          assignments.length;

    const controlSteps = active.flatMap((process) =>
      processDemoStore
        .listSteps(process.currentVersionId)
        .filter((step) => step.isControlPoint && step.evidenceMapComplete),
    );
    const controlPointsScore =
      controlSteps.length > 0
        ? Math.min(1, controlSteps.length / Math.max(active.length, 1))
        : 0.5;

    const underReview = processes.filter((row) => row.status === "under_review").length;
    const standardsScore =
      processes.length === 0 ? 1 : 1 - underReview / processes.length;

    const openIncidents =
      incidentDemoStore.list(tenantId).length + siaiDemoStore.list(tenantId).length;
    const incidentsScore = openIncidents === 0 ? 1 : Math.max(0, 1 - openIncidents / 5);

    const components = [
      processesScore,
      trainingScore,
      controlPointsScore,
      standardsScore,
      incidentsScore,
    ];
    const score =
      components.reduce((sum, value) => sum + value, 0) / components.length;

    return {
      score: Math.round(score * 100),
      components: {
        processesCovered: Math.round(processesScore * 100),
        trainingCurrent: Math.round(trainingScore * 100),
        controlPointsEvident: Math.round(controlPointsScore * 100),
        standardsGaps: Math.round(standardsScore * 100),
        openIncidents: Math.round(incidentsScore * 100),
      },
    };
  }

  runReadinessNotifications(actor: AuthUser) {
    const readiness = this.computeReadinessScore(actor.tenantId);
    notificationDemoStore.create({
      tenantId: actor.tenantId,
      userId: "user-gis-compliance",
      type: "task_assigned",
      title: "Readiness score update",
      body: `Tenant readiness is ${readiness.score}%. Review dashboard for details.`,
      entityType: "dashboard",
      entityId: "readiness",
    });
    return { readiness, notificationsSent: 1 };
  }
}
