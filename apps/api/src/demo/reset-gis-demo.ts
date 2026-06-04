import { resetAgentDemoStore } from "../agents/agent-demo.store";
import { resetAuditDemoStore } from "../audit/audit-demo.store";
import { resetAuditPacksDemoStore } from "../audit/audit-packs-demo.store";
import { resetGuestAccessDemoStore } from "../audit/guest-access-demo.store";
import { resetGuidanceDemoStore } from "../standards/guidance-demo.store";
import { resetTrainingDemoStore } from "../training/training-demo.store";
import { resetEvidenceDemoStore } from "../evidence/evidence-demo.store";
import { resetEscalationDemoStore } from "../notifications/escalation-demo.store";
import { resetNotificationDemoStore } from "../notifications/notification-demo.store";
import { resetTaskDemoStore } from "../notifications/task-demo.store";
import { processDemoStore } from "../processes/process-demo.store";
import { resetProcessDemoStore } from "../processes/process-demo.store";
import { workflowDemoStore } from "../workflows/workflow-demo.store";
import { resetWorkflowDemoStore } from "../workflows/workflow-demo.store";
import { agentDemoStore } from "../agents/agent-demo.store";
import { approvalDemoStore } from "../approvals/approval-demo.store";
import { auditDemoStore } from "../audit/audit-demo.store";
import { auditPacksDemoStore } from "../audit/audit-packs-demo.store";
import { notificationDemoStore } from "../notifications/notification-demo.store";

export type GisDemoSummary = {
  institution: string;
  tenantId: string;
  users: string[];
  processes: number;
  activeProcesses: number;
  workflows: number;
  inProgressWorkflows: number;
  agents: number;
  auditEvents: number;
  auditPacksReady: number;
  notifications: number;
  pendingApprovals: number;
};

const GIS_DEMO_USERS = [
  "gis-admin@aquilens.test — Sarah Mensah (Super Admin)",
  "gis-compliance@aquilens.test — James Asante (Compliance Officer)",
  "gis-head@aquilens.test — Dr. Ama Boateng (Department Head)",
  "gis-owner@aquilens.test — Michael Darko (Process Owner)",
  "gis-staff@aquilens.test — Grace Osei (Staff)",
];

/**
 * Resets all in-memory GIS demo stores to their seeded initial state.
 * Order matters: processes (and approvals) first, then dependent stores.
 */
export function resetGisDemoStores(): GisDemoSummary {
  resetGuidanceDemoStore();
  resetTrainingDemoStore();
  resetProcessDemoStore();
  resetWorkflowDemoStore();
  resetAgentDemoStore();
  resetAuditDemoStore();
  resetAuditPacksDemoStore();
  resetNotificationDemoStore();
  resetTaskDemoStore();
  resetEvidenceDemoStore();
  resetEscalationDemoStore();
  resetGuestAccessDemoStore();

  const tenantId = "tenant-gis";
  const processes = processDemoStore.listProcesses(tenantId);
  const workflows = workflowDemoStore.listInstances(tenantId);
  const agents = agentDemoStore.listAgents(tenantId);
  const audit = auditDemoStore.list(tenantId, { limit: 500 });
  const packs = auditPacksDemoStore.list(tenantId);
  const notifications = notificationDemoStore.listForUser(tenantId, "user-gis-admin");

  return {
    institution: "Ghana International School",
    tenantId,
    users: GIS_DEMO_USERS,
    processes: processes.length,
    activeProcesses: processes.filter((p) => p.status === "active").length,
    workflows: workflows.length,
    inProgressWorkflows: workflows.filter((w) => w.status === "in_progress").length,
    agents: agents.length,
    auditEvents: audit.total,
    auditPacksReady: packs.filter((p) => p.status === "ready").length,
    notifications: notifications.length,
    pendingApprovals: approvalDemoStore
      .listForApprover(tenantId, "user-gis-head", "pending")
      .length,
  };
}

export function formatGisDemoSummary(summary: GisDemoSummary): string {
  const lines = [
    "",
    "══════════════════════════════════════════════════",
    "  Aquilens GIS demo environment ready",
    "══════════════════════════════════════════════════",
    "",
    `Institution: ${summary.institution}`,
    `Tenant:      ${summary.tenantId}`,
    `Password:    Aquilens2024! (all demo users)`,
    "",
    "Demo users:",
    ...summary.users.map((user) => `  • ${user}`),
    "",
    "Seeded data:",
    `  • ${summary.processes} processes (${summary.activeProcesses} active)`,
    `  • ${summary.workflows} workflows (${summary.inProgressWorkflows} in progress)`,
    `  • ${summary.agents} AI agents`,
    `  • ${summary.auditEvents} audit log events`,
    `  • ${summary.auditPacksReady} audit pack(s) ready for download`,
    `  • ${summary.notifications}+ notifications (per user)`,
    `  • ${summary.pendingApprovals} pending approval(s) for Department Head`,
    "",
    "Quick start:",
    "  1. npm run dev:api   (port 3001)",
    "  2. npm run dev:web   (port 3000)",
    "  3. Log in as gis-admin@aquilens.test",
    "",
  ];
  return lines.join("\n");
}
