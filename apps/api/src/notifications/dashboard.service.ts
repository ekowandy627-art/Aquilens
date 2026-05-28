import { Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { approvalDemoStore } from "../approvals/approval-demo.store";
import { processDemoStore } from "../processes/process-demo.store";
import { workflowDemoStore } from "../workflows/workflow-demo.store";
import { taskDemoStore } from "./task-demo.store";

type AdminDashboard = {
  roleView: "super_admin";
  openWorkflows: number;
  pendingApprovals: number;
  overdueItems: number;
  agentsNeedingAttestation: number;
  recentActivity: Array<{
    id: string;
    action: string;
    entityName?: string;
    createdAt: string;
  }>;
};

type ComplianceDashboard = {
  roleView: "compliance_officer";
  openIncidents: number;
  processesNeedingReview: number;
  auditPacksGenerated: number;
};

type ProcessOwnerDashboard = {
  roleView: "process_owner";
  myDraftProcesses: number;
  myPendingApprovals: number;
  myActiveWorkflows: number;
  myOverdueTasks: number;
};

type DepartmentHeadDashboard = {
  roleView: "department_head";
  pendingApprovals: number;
  departmentWorkflows: number;
  overdueItems: number;
};

type StaffDashboard = {
  roleView: "staff";
  myTasks: Array<{
    id: string;
    workflowId: string;
    workflowTitle: string;
    stepTitle: string;
    dueDate: string;
    slaStatus: string;
  }>;
  overdueTaskCount: number;
  completedThisWeek: number;
};

export type DashboardSummary =
  | AdminDashboard
  | ComplianceDashboard
  | ProcessOwnerDashboard
  | DepartmentHeadDashboard
  | StaffDashboard;

@Injectable()
export class DashboardService {
  getSummary(user: AuthUser): DashboardSummary {
    const primaryRole = this.resolvePrimaryRole(user.roles);

    if (primaryRole === "Staff") {
      return this.staffSummary(user);
    }
    if (primaryRole === "Compliance Officer") {
      return this.complianceSummary(user);
    }
    if (primaryRole === "Process Owner") {
      return this.processOwnerSummary(user);
    }
    if (primaryRole === "Department Head") {
      return this.departmentHeadSummary(user);
    }

    return this.adminSummary(user);
  }

  private resolvePrimaryRole(roles: string[]) {
    if (roles.includes("Staff")) {
      return "Staff";
    }
    if (roles.includes("Compliance Officer")) {
      return "Compliance Officer";
    }
    if (roles.includes("Process Owner")) {
      return "Process Owner";
    }
    if (roles.includes("Department Head")) {
      return "Department Head";
    }
    return "Super Admin";
  }

  private adminSummary(user: AuthUser): AdminDashboard {
    const pendingApprovals = approvalDemoStore
      .listForApprover(user.tenantId, "user-gis-head", "pending")
      .length;
    const openWorkflows = workflowDemoStore.listInstances(user.tenantId, {
      status: "in_progress",
    }).length;
    const overdueItems = taskDemoStore.overdueCountForTenant(user.tenantId);

    return {
      roleView: "super_admin",
      openWorkflows,
      pendingApprovals,
      overdueItems,
      agentsNeedingAttestation: 1,
      recentActivity: [
        {
          id: "activity-1",
          action: "SOP submitted for approval",
          entityName: "Record Student Attendance",
          createdAt: "2026-05-27T08:00:00.000Z",
        },
        {
          id: "activity-2",
          action: "Workflow step completed",
          entityName: "Enrol New Student",
          createdAt: "2026-05-26T16:30:00.000Z",
        },
        {
          id: "activity-3",
          action: "Attestation overdue",
          entityName: "AI-001 Attendance Pattern Analyser",
          createdAt: "2026-05-25T09:00:00.000Z",
        },
      ],
    };
  }

  private complianceSummary(user: AuthUser): ComplianceDashboard {
    void user;
    return {
      roleView: "compliance_officer",
      openIncidents: 0,
      processesNeedingReview: processDemoStore
        .listProcesses("tenant-gis", { status: "under_review" })
        .length,
      auditPacksGenerated: 1,
    };
  }

  private processOwnerSummary(user: AuthUser): ProcessOwnerDashboard {
    const drafts = processDemoStore
      .listProcesses(user.tenantId)
      .filter(
        (process) =>
          process.createdBy === user.id && process.status === "draft",
      ).length;

    const myActiveWorkflows = workflowDemoStore
      .listInstances(user.tenantId, { status: "in_progress" })
      .filter((workflow) => workflow.startedBy === user.id).length;

    return {
      roleView: "process_owner",
      myDraftProcesses: drafts,
      myPendingApprovals: 0,
      myActiveWorkflows,
      myOverdueTasks: taskDemoStore.overdueCount(user.tenantId, user.id),
    };
  }

  private departmentHeadSummary(user: AuthUser): DepartmentHeadDashboard {
    const departmentWorkflows = workflowDemoStore.listInstances(user.tenantId, {
      status: "in_progress",
    }).length;
    return {
      roleView: "department_head",
      pendingApprovals: approvalDemoStore.pendingCountForApprover(
        user.tenantId,
        user.id,
      ),
      departmentWorkflows,
      overdueItems: taskDemoStore.overdueCountForTenant(user.tenantId),
    };
  }

  private staffSummary(user: AuthUser): StaffDashboard {
    const myTasks = taskDemoStore.listForUser(user.tenantId, user.id);

    return {
      roleView: "staff",
      myTasks: myTasks.map((task) => ({
        id: task.id,
        workflowId: task.workflowId,
        workflowTitle: task.workflowTitle,
        stepTitle: task.stepTitle,
        dueDate: task.dueDate,
        slaStatus: task.slaStatus,
      })),
      overdueTaskCount: taskDemoStore.overdueCount(user.tenantId, user.id),
      completedThisWeek: taskDemoStore.completedThisWeek(user.tenantId, user.id),
    };
  }
}
