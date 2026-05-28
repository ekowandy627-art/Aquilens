import { apiFetch } from "@/lib/api-client";

export type StaffTask = {
  id: string;
  workflowId: string;
  workflowTitle: string;
  stepTitle: string;
  dueDate: string;
  slaStatus: string;
};

export type DashboardSummary =
  | {
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
    }
  | {
      roleView: "compliance_officer";
      openIncidents: number;
      processesNeedingReview: number;
      auditPacksGenerated: number;
    }
  | {
      roleView: "process_owner";
      myDraftProcesses: number;
      myPendingApprovals: number;
      myActiveWorkflows: number;
      myOverdueTasks: number;
    }
  | {
      roleView: "department_head";
      pendingApprovals: number;
      departmentWorkflows: number;
      overdueItems: number;
    }
  | {
      roleView: "staff";
      myTasks: StaffTask[];
      overdueTaskCount: number;
      completedThisWeek: number;
    };

export async function fetchDashboard() {
  return apiFetch<DashboardSummary>("/dashboard");
}

export type EscalationLevel = {
  id: string;
  levelNumber: number;
  targetRole: string;
  delayHours: number;
};

export type EscalationRule = {
  id: string;
  name: string;
  triggerEvent: string;
  isActive: boolean;
  createdAt: string;
  levels: EscalationLevel[];
};

export async function fetchEscalationRules() {
  return apiFetch<EscalationRule[]>("/escalation-rules");
}

export async function createEscalationRule(input: {
  name: string;
  triggerEvent: string;
  levels: Array<{
    levelNumber: number;
    targetRole: string;
    delayHours: number;
  }>;
}) {
  return apiFetch<EscalationRule>("/escalation-rules", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function toggleEscalationRule(id: string) {
  return apiFetch<EscalationRule>(`/escalation-rules/${id}/toggle`, {
    method: "POST",
    body: "{}",
  });
}

export function slaBadgeClass(status: string) {
  if (status === "overdue") {
    return "bg-red-50 text-red-700";
  }
  if (status === "due_soon") {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-teal-50 text-teal-700";
}
