import { apiFetch } from "@/lib/api-client";

export type NotificationItem = {
  id: string;
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

export function notificationHref(item: NotificationItem) {
  if (item.entityType === "approval" && item.entityId) {
    return `/approvals/${item.entityId}`;
  }
  if (item.entityType === "process" && item.entityId) {
    return `/processes/${item.entityId}`;
  }
  if (item.entityType === "workflow_task") {
    return `/my-tasks`;
  }
  if (item.entityType === "agent" && item.entityId) {
    return `/agents/${item.entityId}`;
  }
  if (item.entityType === "dashboard") {
    return `/dashboard`;
  }
  return "/notifications";
}

export function notificationIcon(type: string) {
  if (type.startsWith("task")) {
    return "task";
  }
  if (type.startsWith("approval") || type === "sop_approved") {
    return "approval";
  }
  if (type.startsWith("attestation")) {
    return "attestation";
  }
  if (type.startsWith("workflow")) {
    return "workflow";
  }
  return "default";
}

export async function fetchNotifications(filters?: {
  isRead?: boolean;
  type?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.isRead !== undefined) {
    params.set("isRead", String(filters.isRead));
  }
  if (filters?.type) {
    params.set("type", filters.type);
  }
  const query = params.toString();
  return apiFetch<NotificationItem[]>(
    `/notifications${query ? `?${query}` : ""}`,
  );
}

export async function fetchUnreadNotificationCount() {
  return apiFetch<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationRead(id: string) {
  return apiFetch<NotificationItem>(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return apiFetch<{ count: number }>("/notifications/read-all", {
    method: "POST",
    body: "{}",
  });
}
