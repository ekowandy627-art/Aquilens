import { randomUUID } from "crypto";
import type { CreateNotificationDto, NotificationRecord } from "./notification.types";

const notifications = new Map<string, NotificationRecord>();

function seedNotification(
  input: Omit<NotificationRecord, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
) {
  const id = input.id ?? randomUUID();
  const record: NotificationRecord = {
    ...input,
    id,
    createdAt: input.createdAt ?? "2026-05-27T08:00:00.000Z",
  };
  notifications.set(id, record);
  return id;
}

function buildInitialNotifications() {
  notifications.clear();

  seedNotification({
    id: "notif-staff-task-assigned",
    tenantId: "tenant-gis",
    userId: "user-gis-staff",
    type: "task_assigned",
    title: "Task assigned: Safeguarding review",
    body: "You have been assigned step 3 in Enrol New Student — Term 2.",
    entityType: "workflow_task",
    entityId: "workflow-gis-enrolment-t2-task-3",
    entityName: "Safeguarding review",
    isRead: false,
  });

  seedNotification({
    id: "notif-head-approval",
    tenantId: "tenant-gis",
    userId: "user-gis-head",
    type: "approval_requested",
    title: "Approval requested: Recruit New Teacher",
    body: "James Asante submitted HR-RECR-001 for your review.",
    entityType: "approval",
    entityId: "approval-hr-recruitment-pending",
    entityName: "Recruit New Teacher",
    isRead: false,
  });

  seedNotification({
    id: "notif-owner-workflow-complete",
    tenantId: "tenant-gis",
    userId: "user-gis-owner",
    type: "workflow_completed",
    title: "Workflow completed: Enrol New Student — Term 1",
    body: "All steps were completed for the Term 1 intake workflow.",
    entityType: "workflow",
    entityId: "workflow-gis-enrolment-t1",
    entityName: "Enrol New Student — Term 1, 2025/26",
    isRead: false,
    createdAt: "2026-05-20T16:05:00.000Z",
  });

  seedNotification({
    id: "notif-owner-sop-approved",
    tenantId: "tenant-gis",
    userId: "user-gis-owner",
    type: "sop_approved",
    title: "SOP approved: Record Student Attendance",
    body: "Dr. Ama Boateng approved version 2 of your SOP.",
    entityType: "process",
    entityId: "proc-gis-attendance",
    entityName: "Record Student Attendance",
    isRead: false,
    createdAt: "2026-05-26T10:00:00.000Z",
  });

  seedNotification({
    id: "notif-compliance-audit-pack",
    tenantId: "tenant-gis",
    userId: "user-gis-compliance",
    type: "audit_pack_ready",
    title: "Audit pack ready: Academics function",
    body: "Your scoped audit pack is ready for download.",
    entityType: "audit_pack",
    entityId: "pack-academics-month",
    entityName: "Academics audit pack",
    isRead: false,
  });

  seedNotification({
    id: "notif-admin-workflow-complete",
    tenantId: "tenant-gis",
    userId: "user-gis-admin",
    type: "workflow_completed",
    title: "Workflow completed: Safeguarding Review — October 2025",
    body: "The safeguarding workflow was closed with evidence attached.",
    entityType: "workflow",
    entityId: "workflow-gis-safeguarding-oct",
    entityName: "Safeguarding Review — October 2025",
    isRead: false,
    createdAt: "2026-05-27T07:00:00.000Z",
  });

  seedNotification({
    id: "notif-admin-attestation",
    tenantId: "tenant-gis",
    userId: "user-gis-admin",
    type: "attestation_overdue",
    title: "Attestation overdue: AI-001 Attendance Pattern Analyser",
    body: "This agent requires attestation.",
    entityType: "agent",
    entityId: "AI-001",
    entityName: "AI-001 Attendance Pattern Analyser",
    isRead: false,
    createdAt: "2026-05-27T06:00:00.000Z",
  });
}

buildInitialNotifications();

export class NotificationDemoStore {
  create(input: CreateNotificationDto) {
    const id = randomUUID();
    const now = new Date().toISOString();
    const record: NotificationRecord = {
      id,
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
      entityName: input.entityName,
      isRead: false,
      createdAt: now,
    };
    notifications.set(id, record);
    return record;
  }

  listForUser(
    tenantId: string,
    userId: string,
    filters: { isRead?: boolean; type?: string } = {},
  ) {
    return [...notifications.values()]
      .filter(
        (item) =>
          item.tenantId === tenantId &&
          item.userId === userId &&
          (filters.isRead === undefined || item.isRead === filters.isRead) &&
          (!filters.type || item.type === filters.type),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  get(id: string) {
    return notifications.get(id) ?? null;
  }

  markRead(tenantId: string, userId: string, id: string) {
    const existing = notifications.get(id);
    if (!existing || existing.tenantId !== tenantId || existing.userId !== userId) {
      return null;
    }
    const updated: NotificationRecord = {
      ...existing,
      isRead: true,
      readAt: new Date().toISOString(),
    };
    notifications.set(id, updated);
    return updated;
  }

  markAllRead(tenantId: string, userId: string) {
    const now = new Date().toISOString();
    let count = 0;
    for (const [id, item] of notifications.entries()) {
      if (item.tenantId === tenantId && item.userId === userId && !item.isRead) {
        notifications.set(id, { ...item, isRead: true, readAt: now });
        count += 1;
      }
    }
    return count;
  }

  unreadCount(tenantId: string, userId: string) {
    return this.listForUser(tenantId, userId, { isRead: false }).length;
  }
}

export const notificationDemoStore = new NotificationDemoStore();

export function resetNotificationDemoStore() {
  buildInitialNotifications();
}
