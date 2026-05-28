export const NOTIFICATION_TYPES = [
  "task_assigned",
  "task_sla_warning",
  "task_sla_missed",
  "approval_requested",
  "approval_approved",
  "approval_rejected",
  "workflow_completed",
  "attestation_due",
  "attestation_overdue",
  "sop_approved",
  "acknowledgement.required",
  "acknowledgement.overdue",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type CreateNotificationDto = {
  tenantId: string;
  userId: string;
  type: NotificationType | string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
};

export type NotificationRecord = {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
};

export type EscalationLevelInput = {
  levelNumber: number;
  targetRole: string;
  delayHours: number;
};

export type EscalationRuleRecord = {
  id: string;
  tenantId: string;
  name: string;
  triggerEvent: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  levels: Array<{
    id: string;
    levelNumber: number;
    targetRole: string;
    delayHours: number;
  }>;
};

export type StaffTaskRecord = {
  id: string;
  tenantId: string;
  assigneeId: string;
  workflowId: string;
  workflowTitle: string;
  stepTitle: string;
  dueDate: string;
  slaStatus: "on_track" | "due_soon" | "overdue";
  status: "pending" | "completed";
};
