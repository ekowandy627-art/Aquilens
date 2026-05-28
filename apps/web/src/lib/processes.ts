import type { ExecutionSchedule, ProcessPersonRole } from "@/lib/execution-schedule";
import type { LinkedAgent } from "@/lib/agents";

export type ProcessAccess = {
  processRole?: ProcessPersonRole;
  canView: boolean;
  canEdit: boolean;
  canManagePeople: boolean;
};

export type ProcessParticipant = {
  role: string;
  userId?: string;
};

export type ProcessLifecycle = {
  canSubmit: boolean;
  canPublish: boolean;
  canCreateVersion: boolean;
  canStartWorkflow: boolean;
  canArchive: boolean;
  reviewOverdue?: boolean;
};

export type ProcessListItem = {
  id: string;
  functionId: string;
  processAreaId: string;
  processCode?: string;
  name: string;
  description?: string;
  purpose?: string;
  status: string;
  riskRating: string;
  reviewFrequency: string;
  executionSchedule: ExecutionSchedule;
  approvalRequired: boolean;
  tags: string[];
  functionName?: string;
  processAreaName?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcessStep = {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  responsibleRole?: string;
  stepType: "manual" | "approval" | "system";
  inputs?: string;
  outputs?: string;
  controls?: string;
  notes?: string;
  evidenceRequired: boolean;
  agents?: LinkedAgent[];
};

export type ProcessPerson = {
  id: string;
  userId?: string;
  role: ProcessPersonRole;
};

export type ProcessVersionSummary = {
  id: string;
  versionNumber: number;
  status: string;
  changeSummary?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  effectiveDate?: string;
  reviewDueDate?: string;
  publishedAt?: string;
  publishedBy?: string;
  archivedAt?: string;
  reviewOverdue?: boolean;
  isCurrent?: boolean;
};

export type ProcessLinkedGuidance = {
  packId: string;
  packSlug?: string;
  packName?: string;
  requirementId?: string;
};

export type ProcessDetail = ProcessListItem & {
  whoItAffects: string[];
  linkedSystems: string[];
  linkedPolicies?: string;
  riskNotes?: string;
  governanceControls: unknown[];
  regulatoryReference?: string;
  triggerDescription?: string;
  participants: ProcessParticipant[];
  inputs?: string;
  outputs?: string;
  exceptions?: string;
  relatedDocuments: unknown[];
  acknowledgementRequired: boolean;
  access: ProcessAccess;
  lifecycle?: ProcessLifecycle;
  currentVersion: ProcessVersionSummary | null;
  steps: ProcessStep[];
  people: ProcessPerson[];
  linkedGuidance?: ProcessLinkedGuidance[];
};

export function canCreateProcess(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("processes:create");
}

export function canEditProcess(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("processes:edit");
}

export function canPublishProcess(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("processes:publish");
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "approved":
      return "bg-sky-50 text-sky-700";
    case "under_review":
      return "bg-amber-50 text-amber-700";
    case "archived":
      return "bg-slate-200 text-slate-700";
    case "retired":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function formatParticipants(participants: ProcessParticipant[]) {
  if (!participants.length) {
    return "—";
  }
  return participants
    .map((participant) =>
      participant.userId
        ? `${participant.role} (${participant.userId})`
        : participant.role,
    )
    .join(", ");
}

export function parseParticipantsText(text: string): ProcessParticipant[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [role, userId] = line.split(":").map((part) => part.trim());
      if (!role) {
        return null;
      }
      return userId ? { role, userId } : { role };
    })
    .filter((value): value is ProcessParticipant => value !== null);
}

export function participantsToText(participants: ProcessParticipant[]) {
  return participants
    .map((participant) =>
      participant.userId ? `${participant.role}: ${participant.userId}` : participant.role,
    )
    .join("\n");
}

export function riskBadgeClass(risk: string) {
  switch (risk) {
    case "high":
      return "bg-red-50 text-red-700";
    case "low":
      return "bg-sky-50 text-sky-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function roleLabel(role: ProcessPersonRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "editor":
      return "Editor";
    case "viewer":
      return "Viewer";
    case "approver":
      return "Approver";
  }
}
