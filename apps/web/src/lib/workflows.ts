export type WorkflowTask = {
  id: string;
  workflowInstanceId: string;
  processStepId?: string;
  stepNumber: number;
  title: string;
  description?: string;
  stepType: "manual" | "approval";
  status: string;
  assignedTo?: string;
  assignedRole?: string;
  evidenceRequired: boolean;
  slaHours?: number;
  slaDueAt?: string;
  startedAt?: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
  skipReason?: string;
  isDone?: boolean;
};

export type WorkflowListItem = {
  id: string;
  title: string;
  context?: string;
  status: string;
  processId?: string;
  processVersionId?: string;
  processName?: string;
  processCode?: string;
  startedBy?: string;
  startedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  tasksCompleted: number;
  tasksTotal: number;
};

export type WorkflowDetail = WorkflowListItem & {
  tasks: WorkflowTask[];
};

export type MyTaskItem = WorkflowTask & {
  workflowId: string;
  workflowTitle: string;
  workflowStatus: string;
  processId?: string;
  processName?: string;
};

export type WorkflowAuditEvent = {
  id: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  action: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
};

export function workflowStatusBadgeClass(status: string) {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "cancelled":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function taskStatusBadgeClass(status: string) {
  switch (status) {
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "skipped":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function taskStatusLabel(status: string) {
  return status.replace("_", " ");
}

export function isTaskActionable(status: string) {
  return status === "pending" || status === "in_progress";
}

export type WorkflowEvidence = {
  id: string;
  workflowInstanceId: string;
  workflowTaskId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  checksum: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
};

export type EvidenceDownload = {
  signedUrl: string;
  expiresAt: string;
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
