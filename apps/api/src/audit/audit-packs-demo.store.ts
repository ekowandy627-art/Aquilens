export type AuditPackJobStatus = "pending" | "ready" | "failed";

export type AuditPackJob = {
  id: string;
  tenantId: string;
  scope: "function" | "process" | "date_range" | "incident";
  scopeId?: string;
  scopeLabel?: string;
  dateFrom?: string;
  dateTo?: string;
  status: AuditPackJobStatus;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  completedAt?: string;
  pdfBuffer?: Buffer;
  errorMessage?: string;
  jurisdictionIds?: string[];
};

function buildInitialJobs(): AuditPackJob[] {
  return [
    {
      id: "pack-academics-month",
      tenantId: "tenant-gis",
      scope: "function",
      scopeId: "fn-school-academics",
      scopeLabel: "Academics",
      dateFrom: "2026-04-01T00:00:00.000Z",
      dateTo: "2026-04-30T23:59:59.000Z",
      status: "ready",
      createdBy: "user-gis-compliance",
      createdByName: "James Asante",
      createdAt: "2026-04-28T14:55:00.000Z",
      completedAt: "2026-04-28T15:00:00.000Z",
      jurisdictionIds: ["jurisdiction-ghana"],
    },
    {
      id: "pack-admn-enr-001",
      tenantId: "tenant-gis",
      scope: "process",
      scopeId: "proc-gis-enrolment",
      scopeLabel: "ADMS-ENR-001 — Enrol New Student",
      dateFrom: "2025-11-28T00:00:00.000Z",
      dateTo: "2026-05-28T23:59:59.000Z",
      status: "ready",
      createdBy: "user-gis-compliance",
      createdByName: "James Asante",
      createdAt: "2026-05-25T09:00:00.000Z",
      completedAt: "2026-05-25T09:00:05.000Z",
    },
  ];
}

let jobs = buildInitialJobs();

export class AuditPacksDemoStore {
  list(tenantId: string) {
    return jobs
      .filter((job) => job.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((job) => this.toSummary(job));
  }

  get(tenantId: string, jobId: string) {
    const job = jobs.find((entry) => entry.tenantId === tenantId && entry.id === jobId);
    return job ?? null;
  }

  create(input: Omit<AuditPackJob, "status" | "createdAt">) {
    const job: AuditPackJob = {
      ...input,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    jobs.unshift(job);
    return job;
  }

  markReady(jobId: string, pdfBuffer: Buffer) {
    const job = jobs.find((entry) => entry.id === jobId);
    if (!job) {
      return null;
    }
    job.status = "ready";
    job.pdfBuffer = pdfBuffer;
    job.completedAt = new Date().toISOString();
    return job;
  }

  markFailed(jobId: string, errorMessage: string) {
    const job = jobs.find((entry) => entry.id === jobId);
    if (!job) {
      return null;
    }
    job.status = "failed";
    job.errorMessage = errorMessage;
    job.completedAt = new Date().toISOString();
    return job;
  }

  toSummary(job: AuditPackJob) {
    return {
      id: job.id,
      scope: job.scope,
      scopeId: job.scopeId,
      scopeLabel: job.scopeLabel,
      dateFrom: job.dateFrom,
      dateTo: job.dateTo,
      status: job.status,
      createdBy: job.createdBy,
      createdByName: job.createdByName,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
    };
  }
}

export const auditPacksDemoStore = new AuditPacksDemoStore();

export function resetAuditPacksDemoStore() {
  jobs = buildInitialJobs();
}
