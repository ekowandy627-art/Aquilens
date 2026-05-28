import { randomUUID } from "crypto";

export type AuditLogRecord = {
  id: string;
  tenantId: string;
  timestamp: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  actorId?: string;
  actorName?: string;
  action: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AuditListFilters = {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
  actorScopeId?: string;
};

const actorNames: Record<string, string> = {
  "user-gis-admin": "Sarah Mensah",
  "user-gis-compliance": "James Asante",
  "user-gis-head": "Dr. Ama Boateng",
  "user-gis-owner": "Michael Darko",
  "user-gis-staff": "Grace Osei",
};

function seedEvent(
  input: Omit<AuditLogRecord, "id"> & { id?: string },
): AuditLogRecord {
  return {
    id: input.id ?? randomUUID(),
    tenantId: input.tenantId,
    timestamp: input.timestamp,
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    entityName: input.entityName,
    actorId: input.actorId,
    actorName: input.actorName,
    action: input.action,
    beforeState: input.beforeState,
    afterState: input.afterState,
    metadata: input.metadata ?? {},
  };
}

function buildInitialAuditLog(): AuditLogRecord[] {
  const tenantId = "tenant-gis";

  return [
    seedEvent({
      id: "audit-auth-login-admin",
      tenantId,
      timestamp: "2026-05-01T08:00:00.000Z",
      eventType: "auth.login",
      entityType: "User",
      entityId: "user-gis-admin",
      entityName: actorNames["user-gis-admin"],
      actorId: "user-gis-admin",
      actorName: actorNames["user-gis-admin"],
      action: "Signed in to Aquilens",
    }),
    seedEvent({
      id: "audit-process-created-attendance",
      tenantId,
      timestamp: "2026-05-10T09:00:00.000Z",
      eventType: "process.created",
      entityType: "Process",
      entityId: "proc-gis-attendance",
      entityName: "Record Student Attendance",
      actorId: "user-gis-owner",
      actorName: actorNames["user-gis-owner"],
      action: 'Created SOP "Record Student Attendance"',
      afterState: { status: "draft", riskRating: "medium" },
    }),
    seedEvent({
      id: "audit-process-created-enrolment",
      tenantId,
      timestamp: "2026-05-12T10:00:00.000Z",
      eventType: "process.created",
      entityType: "Process",
      entityId: "proc-gis-enrolment",
      entityName: "Enrol New Student",
      actorId: "user-gis-owner",
      actorName: actorNames["user-gis-owner"],
      action: 'Created SOP "Enrol New Student"',
      afterState: { status: "draft", riskRating: "high" },
    }),
    seedEvent({
      id: "audit-process-submitted-enrolment-v1",
      tenantId,
      timestamp: "2026-05-20T11:00:00.000Z",
      eventType: "process.submitted",
      entityType: "Process",
      entityId: "proc-gis-enrolment",
      entityName: "Enrol New Student",
      actorId: "user-gis-owner",
      actorName: actorNames["user-gis-owner"],
      action: "Submitted process for approval",
      beforeState: { status: "draft" },
      afterState: { status: "under_review" },
      metadata: { approvalId: "approval-enrolment-v1-rejected" },
    }),
    seedEvent({
      id: "audit-process-rejected-enrolment-v1",
      tenantId,
      timestamp: "2026-05-21T10:00:00.000Z",
      eventType: "process.rejected",
      entityType: "Process",
      entityId: "proc-gis-enrolment",
      entityName: "Enrol New Student",
      actorId: "user-gis-head",
      actorName: actorNames["user-gis-head"],
      action: 'Rejected SOP "Enrol New Student"',
      metadata: { comment: "Missing safeguarding step" },
    }),
    seedEvent({
      id: "audit-process-version-created-enrolment-v2",
      tenantId,
      timestamp: "2026-05-24T14:00:00.000Z",
      eventType: "process.version_created",
      entityType: "ProcessVersion",
      entityId: "proc-gis-enrolment-v2",
      entityName: "Enrol New Student v2",
      actorId: "user-gis-owner",
      actorName: actorNames["user-gis-owner"],
      action: "Created draft v2",
      metadata: { processId: "proc-gis-enrolment" },
    }),
    seedEvent({
      id: "audit-process-approved-enrolment-v2",
      tenantId,
      timestamp: "2026-05-26T10:00:00.000Z",
      eventType: "process.approved",
      entityType: "Process",
      entityId: "proc-gis-enrolment",
      entityName: "Enrol New Student",
      actorId: "user-gis-head",
      actorName: actorNames["user-gis-head"],
      action: 'Approved SOP "Enrol New Student"',
      beforeState: { status: "under_review" },
      afterState: { status: "active" },
      metadata: { comment: "Safeguarding step added — approved." },
    }),
    seedEvent({
      id: "audit-process-approved-attendance-v2",
      tenantId,
      timestamp: "2026-05-26T10:00:00.000Z",
      eventType: "process.approved",
      entityType: "Process",
      entityId: "proc-gis-attendance",
      entityName: "Record Student Attendance",
      actorId: "user-gis-head",
      actorName: actorNames["user-gis-head"],
      action: 'Approved SOP "Record Student Attendance" v2',
      beforeState: { status: "under_review" },
      afterState: { status: "active" },
    }),
    seedEvent({
      id: "audit-process-created-fees",
      tenantId,
      timestamp: "2026-05-15T11:30:00.000Z",
      eventType: "process.created",
      entityType: "Process",
      entityId: "proc-gis-fees",
      entityName: "Process Fee Payment",
      actorId: "user-gis-owner",
      actorName: actorNames["user-gis-owner"],
      action: 'Created SOP "Process Fee Payment"',
      afterState: { status: "draft", riskRating: "low" },
    }),
    seedEvent({
      id: "audit-user-invited",
      tenantId,
      timestamp: "2026-05-05T12:00:00.000Z",
      eventType: "user.invited",
      entityType: "User",
      entityId: "user-gis-staff",
      entityName: actorNames["user-gis-staff"],
      actorId: "user-gis-admin",
      actorName: actorNames["user-gis-admin"],
      action: "Invited user to tenant",
      metadata: { email: "gis-staff@aquilens.test", role: "Staff" },
    }),
    seedEvent({
      id: "audit-role-assigned",
      tenantId,
      timestamp: "2026-05-06T09:00:00.000Z",
      eventType: "role.assigned",
      entityType: "User",
      entityId: "user-gis-compliance",
      entityName: actorNames["user-gis-compliance"],
      actorId: "user-gis-admin",
      actorName: actorNames["user-gis-admin"],
      action: "Assigned Compliance Officer role",
      afterState: { role: "Compliance Officer" },
    }),
    seedEvent({
      id: "audit-staff-view-process",
      tenantId,
      timestamp: "2026-05-28T07:30:00.000Z",
      eventType: "process.viewed",
      entityType: "Process",
      entityId: "proc-gis-attendance",
      entityName: "Record Student Attendance",
      actorId: "user-gis-staff",
      actorName: actorNames["user-gis-staff"],
      action: "Viewed process details",
    }),
    seedEvent({
      id: "audit-sop-ai-generated",
      tenantId,
      timestamp: "2026-05-18T16:00:00.000Z",
      eventType: "sop.ai_generated",
      entityType: "Process",
      entityId: "proc-gis-safeguarding",
      entityName: "Manage Safeguarding Concern",
      actorId: "user-gis-owner",
      actorName: actorNames["user-gis-owner"],
      action: "Generated SOP draft with AI",
      metadata: { model: "gpt-4o", descriptionLength: 420, tokensUsed: 890 },
    }),
    seedEvent({
      id: "audit-incident-closed-breach",
      tenantId,
      timestamp: "2026-05-19T11:00:00.000Z",
      eventType: "incident.closed",
      entityType: "Incident",
      entityId: "incident-gis-data-breach-2025",
      entityName: "Data breach — student report sent to wrong parent",
      actorId: "user-gis-compliance",
      actorName: actorNames["user-gis-compliance"],
      action: "Closed incident with RCA and corrective actions complete",
      afterState: { status: "closed", correctiveActionsComplete: 2 },
    }),
    seedEvent({
      id: "audit-pack-generated-academics",
      tenantId,
      timestamp: "2026-04-28T15:00:00.000Z",
      eventType: "audit_pack.generated",
      entityType: "AuditPack",
      entityId: "pack-academics-month",
      entityName: "Academics function — last month",
      actorId: "user-gis-compliance",
      actorName: actorNames["user-gis-compliance"],
      action: "Generated audit pack for Academics function",
      metadata: { scope: "function", scopeId: "fn-school-academics" },
    }),
    seedEvent({
      id: "audit-guest-access-created",
      tenantId,
      timestamp: "2026-05-20T10:00:00.000Z",
      eventType: "guest_access.created",
      entityType: "GuestAccess",
      entityId: "guest-cis-auditor",
      entityName: "auditor@cis.org",
      actorId: "user-gis-admin",
      actorName: actorNames["user-gis-admin"],
      action: "Created external auditor guest access",
      metadata: {
        scope: "function",
        scopeId: "fn-school-academics",
        auditorEmail: "auditor@cis.org",
      },
    }),
  ];
}

let entries = buildInitialAuditLog();

function matchesFilters(entry: AuditLogRecord, filters: AuditListFilters) {
  if (filters.entityType && filters.entityType !== "All") {
    if (entry.entityType.toLowerCase() !== filters.entityType.toLowerCase()) {
      return false;
    }
  }
  if (filters.entityId && entry.entityId !== filters.entityId) {
    return false;
  }
  if (filters.actorId && entry.actorId !== filters.actorId) {
    return false;
  }
  if (filters.eventType && !entry.eventType.includes(filters.eventType)) {
    return false;
  }
  if (filters.dateFrom && entry.timestamp < filters.dateFrom) {
    return false;
  }
  if (filters.dateTo && entry.timestamp > filters.dateTo) {
    return false;
  }
  if (filters.actorScopeId && entry.actorId !== filters.actorScopeId) {
    return false;
  }
  return true;
}

export class AuditDemoStore {
  insert(record: Omit<AuditLogRecord, "id"> & { id?: string }) {
    const entry = seedEvent(record);
    entries.unshift(entry);
    return entry;
  }

  list(tenantId: string, filters: AuditListFilters = {}) {
    const limit = filters.limit ?? 50;
    const sorted = entries
      .filter((entry) => entry.tenantId === tenantId)
      .filter((entry) => matchesFilters(entry, filters))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    let startIndex = 0;
    if (filters.cursor) {
      const cursorIndex = sorted.findIndex((entry) => entry.id === filters.cursor);
      startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
    }

    const page = sorted.slice(startIndex, startIndex + limit);
    const nextCursor =
      startIndex + limit < sorted.length ? page[page.length - 1]?.id : undefined;

    return { items: page, nextCursor, total: sorted.length };
  }

  exportCsv(tenantId: string, filters: AuditListFilters = {}) {
    const { items } = this.list(tenantId, { ...filters, limit: 10_000 });
    const header =
      "timestamp,event_type,entity_type,entity_id,entity_name,actor_id,actor_name,action";
    const rows = items.map((entry) =>
      [
        entry.timestamp,
        entry.eventType,
        entry.entityType,
        entry.entityId ?? "",
        csvEscape(entry.entityName ?? ""),
        entry.actorId ?? "",
        csvEscape(entry.actorName ?? ""),
        csvEscape(entry.action),
      ].join(","),
    );
    return [header, ...rows].join("\n");
  }

  getById(tenantId: string, id: string) {
    return entries.find((entry) => entry.tenantId === tenantId && entry.id === id) ?? null;
  }
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export const auditDemoStore = new AuditDemoStore();

export function resetAuditDemoStore() {
  entries = buildInitialAuditLog();
}
