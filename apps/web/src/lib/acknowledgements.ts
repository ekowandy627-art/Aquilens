import { apiFetch } from "@/lib/api-client";

export type AcknowledgementAssignment = {
  id: string;
  campaignId: string;
  processId: string;
  processName: string;
  processVersionId: string;
  versionNumber?: number;
  userId: string;
  userName?: string;
  userEmail?: string;
  status: "pending" | "completed" | "overdue";
  dueDate?: string;
  acknowledgedAt?: string;
};

export type AssignmentSopRead = {
  assignmentId: string;
  processId: string;
  processName: string;
  processVersionId: string;
  versionNumber?: number;
  effectiveDate?: string;
  readOnly: boolean;
  steps: Array<{
    id: string;
    step_number?: number;
    stepNumber?: number;
    title: string;
    description?: string;
    step_type?: string;
    stepType?: string;
    evidence_required?: boolean;
    evidenceRequired?: boolean;
  }>;
};

export type ProcessAcknowledgementCampaign = {
  id: string;
  processId: string;
  processVersionId: string;
  dueDate?: string;
  createdAt: string;
  assignments: AcknowledgementAssignment[];
  completionPercent: number;
};

export type ProcessAcknowledgements = {
  processId: string;
  campaigns: ProcessAcknowledgementCampaign[];
};

export function canReadAcknowledgements(permissions: string[]) {
  return (
    permissions.includes("*") || permissions.includes("acknowledgements:read")
  );
}

export function acknowledgementStatusBadgeClass(
  status: AcknowledgementAssignment["status"],
) {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-800";
  }
  if (status === "overdue") {
    return "bg-red-50 text-red-700";
  }
  return "bg-amber-50 text-amber-800";
}

export async function fetchMyAcknowledgements() {
  return apiFetch<AcknowledgementAssignment[]>("/acknowledgements/my");
}

export async function fetchAssignmentSop(assignmentId: string) {
  return apiFetch<AssignmentSopRead>(
    `/acknowledgements/assignments/${assignmentId}/sop`,
  );
}

export async function confirmAcknowledgement(
  assignmentId: string,
  processVersionId: string,
) {
  return apiFetch<{
    assignment: AcknowledgementAssignment;
    acknowledgement: { acknowledgedAt: string; processVersionId: string };
  }>(`/acknowledgements/${assignmentId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ processVersionId }),
  });
}

export async function fetchProcessAcknowledgements(processId: string) {
  return apiFetch<ProcessAcknowledgements>(
    `/processes/${processId}/acknowledgements`,
  );
}

export async function fetchOverdueAcknowledgements() {
  return apiFetch<AcknowledgementAssignment[]>("/acknowledgements/overdue");
}
