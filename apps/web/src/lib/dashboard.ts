import { apiFetch } from "@/lib/api-client";

export type StaffTrainingItem = {
  id: string;
  processId: string;
  processName: string;
  status: string;
  dueDate?: string;
};

export type StaffAssignedProcess = {
  id: string;
  name: string;
  processCode?: string;
  status: string;
};

type ReadinessBreakdown = {
  score: number;
  components: {
    processesCovered: number;
    trainingCurrent: number;
    controlPointsEvident: number;
    standardsGaps: number;
    openIncidents: number;
  };
};

export type DashboardSummary =
  | {
      roleView: "super_admin";
      readiness: ReadinessBreakdown;
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
      readiness: ReadinessBreakdown;
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
      pendingTraining: StaffTrainingItem[];
      assignedProcesses: StaffAssignedProcess[];
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

export function trainingStatusBadgeClass(status: string) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-800";
  }
  if (status === "overdue") {
    return "bg-red-50 text-red-700";
  }
  return "bg-amber-50 text-amber-800";
}

/** @deprecated Use trainingStatusBadgeClass */
export const acknowledgementStatusBadgeClass = trainingStatusBadgeClass;
