import type { StaffTaskRecord } from "./notification.types";

const tasks: StaffTaskRecord[] = [
  {
    id: "task-gis-interview",
    tenantId: "tenant-gis",
    assigneeId: "user-gis-staff",
    workflowId: "wf-gis-enrolment",
    workflowTitle: "Enrol New Student",
    stepTitle: "Schedule admission interview",
    dueDate: "2026-05-30",
    slaStatus: "on_track",
    status: "pending",
  },
  {
    id: "task-gis-documents",
    tenantId: "tenant-gis",
    assigneeId: "user-gis-staff",
    workflowId: "wf-gis-enrolment",
    workflowTitle: "Enrol New Student",
    stepTitle: "Collect registration documents",
    dueDate: "2026-05-20",
    slaStatus: "overdue",
    status: "pending",
  },
  {
    id: "task-gis-owner-draft",
    tenantId: "tenant-gis",
    assigneeId: "user-gis-owner",
    workflowId: "wf-gis-fees",
    workflowTitle: "Issue Fee Invoice",
    stepTitle: "Review invoice totals",
    dueDate: "2026-05-29",
    slaStatus: "due_soon",
    status: "pending",
  },
];

export class TaskDemoStore {
  listForUser(tenantId: string, assigneeId: string) {
    return tasks.filter(
      (task) =>
        task.tenantId === tenantId &&
        task.assigneeId === assigneeId &&
        task.status === "pending",
    );
  }

  overdueCount(tenantId: string, assigneeId: string) {
    return this.listForUser(tenantId, assigneeId).filter(
      (task) => task.slaStatus === "overdue",
    ).length;
  }

  overdueCountForTenant(tenantId: string) {
    return tasks.filter(
      (task) =>
        task.tenantId === tenantId &&
        task.status === "pending" &&
        task.slaStatus === "overdue",
    ).length;
  }

  completedThisWeek(tenantId: string, assigneeId: string) {
    void tenantId;
    void assigneeId;
    return 1;
  }
}

export const taskDemoStore = new TaskDemoStore();

export function resetTaskDemoStore() {
  // Static seed — no mutation in demo flows yet.
}
