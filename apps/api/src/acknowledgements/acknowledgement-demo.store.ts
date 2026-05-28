import { randomUUID } from "crypto";
import { processDemoStore } from "../processes/process-demo.store";
import {
  computeAssignmentStatus,
  type AssignmentStatus,
} from "./acknowledgement-status";

export type AcknowledgementCampaignRecord = {
  id: string;
  tenantId: string;
  processId: string;
  processVersionId: string;
  dueDate?: string;
  createdBy?: string;
  createdAt: string;
};

export type AcknowledgementAssignmentRecord = {
  id: string;
  tenantId: string;
  campaignId: string;
  userId: string;
  status: AssignmentStatus;
  dueDate?: string;
  overdueNotified?: boolean;
};

export type AcknowledgementRecord = {
  id: string;
  tenantId: string;
  assignmentId: string;
  processVersionId: string;
  userId: string;
  acknowledgedAt: string;
  userAgent?: string;
};

type StoreState = {
  campaigns: Map<string, AcknowledgementCampaignRecord>;
  assignments: Map<string, AcknowledgementAssignmentRecord>;
  acknowledgements: Map<string, AcknowledgementRecord>;
};

function buildInitialState(): StoreState {
  return {
    campaigns: new Map(),
    assignments: new Map(),
    acknowledgements: new Map(),
  };
}

let state = buildInitialState();

export class AcknowledgementDemoStore {
  createCampaign(input: {
    tenantId: string;
    processId: string;
    processVersionId: string;
    userIds: string[];
    dueDate?: string;
    createdBy?: string;
  }) {
    const campaignId = randomUUID();
    const createdAt = new Date().toISOString();
    const campaign: AcknowledgementCampaignRecord = {
      id: campaignId,
      tenantId: input.tenantId,
      processId: input.processId,
      processVersionId: input.processVersionId,
      dueDate: input.dueDate,
      createdBy: input.createdBy,
      createdAt,
    };
    state.campaigns.set(campaignId, campaign);

    const assignments = input.userIds.map((userId) => {
      const assignment: AcknowledgementAssignmentRecord = {
        id: randomUUID(),
        tenantId: input.tenantId,
        campaignId,
        userId,
        status: "pending",
        dueDate: input.dueDate,
      };
      state.assignments.set(assignment.id, assignment);
      return assignment;
    });

    return { campaign, assignments };
  }

  getCampaign(campaignId: string) {
    return state.campaigns.get(campaignId) ?? null;
  }

  listCampaignsForProcess(tenantId: string, processId: string) {
    return [...state.campaigns.values()]
      .filter(
        (campaign) =>
          campaign.tenantId === tenantId && campaign.processId === processId,
      )
      .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listAssignmentsForCampaign(campaignId: string) {
    return [...state.assignments.values()].filter(
      (row) => row.campaignId === campaignId,
    );
  }

  getAssignment(assignmentId: string) {
    return state.assignments.get(assignmentId) ?? null;
  }

  listAssignmentsForUser(tenantId: string, userId: string) {
    return [...state.assignments.values()]
      .filter((row) => row.tenantId === tenantId && row.userId === userId)
      .map((row) => this.refreshAssignmentStatus(row));
  }

  listPendingForUser(tenantId: string, userId: string) {
    return this.listAssignmentsForUser(tenantId, userId).filter(
      (row) => row.status === "pending" || row.status === "overdue",
    );
  }

  listOverdue(tenantId: string) {
    return [...state.assignments.values()]
      .filter((row) => row.tenantId === tenantId)
      .map((row) => this.refreshAssignmentStatus(row))
      .filter((row) => row.status === "overdue");
  }

  confirmAssignment(
    assignmentId: string,
    userId: string,
    input: { userAgent?: string },
  ) {
    const assignment = state.assignments.get(assignmentId);
    if (!assignment || assignment.userId !== userId) {
      return { error: "FORBIDDEN" as const };
    }

    const existing = [...state.acknowledgements.values()].find(
      (row) => row.assignmentId === assignmentId,
    );
    if (existing) {
      return { acknowledgement: existing, assignment: this.refreshAssignmentStatus(assignment) };
    }

    const campaign = state.campaigns.get(assignment.campaignId);
    if (!campaign) {
      return { error: "NOT_FOUND" as const };
    }

    const acknowledgedAt = new Date().toISOString();
    const acknowledgement: AcknowledgementRecord = {
      id: randomUUID(),
      tenantId: assignment.tenantId,
      assignmentId,
      processVersionId: campaign.processVersionId,
      userId,
      acknowledgedAt,
      userAgent: input.userAgent,
    };
    state.acknowledgements.set(acknowledgement.id, acknowledgement);

    const updated: AcknowledgementAssignmentRecord = {
      ...assignment,
      status: "completed",
    };
    state.assignments.set(assignmentId, updated);

    return { acknowledgement, assignment: updated };
  }

  listAcknowledgementsForUser(tenantId: string, userId: string) {
    return [...state.acknowledgements.values()].filter(
      (row) => row.tenantId === tenantId && row.userId === userId,
    );
  }

  private refreshAssignmentStatus(assignment: AcknowledgementAssignmentRecord) {
    if (assignment.status === "completed") {
      return assignment;
    }
    const campaign = state.campaigns.get(assignment.campaignId);
    const dueDate = assignment.dueDate ?? campaign?.dueDate;
    const nextStatus = computeAssignmentStatus(assignment.status, dueDate);
    if (nextStatus !== assignment.status) {
      const updated = {
        ...assignment,
        status: nextStatus,
        overdueNotified:
          nextStatus === "overdue" ? assignment.overdueNotified : assignment.overdueNotified,
      };
      state.assignments.set(assignment.id, updated);
      return updated;
    }
    return assignment;
  }

  markOverdueNotified(assignmentId: string) {
    const assignment = state.assignments.get(assignmentId);
    if (!assignment) {
      return null;
    }
    const updated = { ...assignment, overdueNotified: true };
    state.assignments.set(assignmentId, updated);
    return updated;
  }
}

export const acknowledgementDemoStore = new AcknowledgementDemoStore();

export function resetAcknowledgementDemoStore() {
  state = buildInitialState();
}

export function seedGisEnrolmentAcknowledgementDemo() {
  acknowledgementDemoStore.createCampaign({
    tenantId: "tenant-gis",
    processId: "proc-gis-enrolment",
    processVersionId: "proc-gis-enrolment-v3",
    userIds: ["user-gis-staff"],
    dueDate: "2026-06-30",
    createdBy: "user-gis-owner",
  });
  processDemoStore.ensureViewerAccess("proc-gis-enrolment-v3", ["user-gis-staff"]);
}

