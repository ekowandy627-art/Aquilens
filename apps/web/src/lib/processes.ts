import type { ExecutionSchedule, ProcessPersonRole } from "@/lib/execution-schedule";
import type { LinkedAgent } from "@/lib/agents";

export type ProcessAccess = {
  processRole?: ProcessPersonRole;
  canView: boolean;
  canEdit: boolean;
  canManagePeople: boolean;
};

export type ProcessLifecycle = {
  canSubmit: boolean;
  canCreateVersion: boolean;
  canStartWorkflow: boolean;
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

export type ProcessDetail = ProcessListItem & {
  whoItAffects: string[];
  linkedSystems: string[];
  linkedPolicies?: string;
  riskNotes?: string;
  governanceControls: unknown[];
  regulatoryReference?: string;
  access: ProcessAccess;
  lifecycle?: ProcessLifecycle;
  currentVersion: {
    id: string;
    versionNumber: number;
    status: string;
    changeSummary?: string;
    createdAt: string;
  } | null;
  steps: ProcessStep[];
  people: ProcessPerson[];
};

export function canCreateProcess(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("processes:create");
}

export function canEditProcess(permissions: string[]) {
  return permissions.includes("*") || permissions.includes("processes:edit");
}

export function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700";
    case "under_review":
      return "bg-amber-50 text-amber-700";
    case "retired":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
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
