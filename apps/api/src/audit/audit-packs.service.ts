import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { processDemoStore } from "../processes/process-demo.store";
import { demoSchoolScaffold } from "../tenants/demo-scaffold";
import { AuditService } from "./audit.service";
import {
  auditPacksDemoStore,
  type AuditPackJob,
} from "./audit-packs-demo.store";
import { generateAuditPackPdf } from "./audit-pack-pdf";

type GeneratePackInput = {
  scope: AuditPackJob["scope"];
  scopeId?: string;
  dateFrom?: string;
  dateTo?: string;
};

@Injectable()
export class AuditPacksService {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  list(user: AuthUser) {
    return auditPacksDemoStore.list(user.tenantId);
  }

  getStatus(user: AuthUser, jobId: string) {
    const job = auditPacksDemoStore.get(user.tenantId, jobId);

    if (!job) {
      return null;
    }

    return auditPacksDemoStore.toSummary(job);
  }

  async generate(user: AuthUser, input: GeneratePackInput) {
    const scopeLabel = this.resolveScopeLabel(user.tenantId, input);
    const jobId = randomUUID();

    const job = auditPacksDemoStore.create({
      id: jobId,
      tenantId: user.tenantId,
      scope: input.scope,
      scopeId: input.scopeId,
      scopeLabel,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      createdBy: user.id,
      createdByName: user.email,
    });

    await this.audit.log(user, {
      eventType: "audit_pack.generated",
      entityType: "AuditPack",
      entityId: job.id,
      entityName: scopeLabel,
      action: `Generated audit pack for ${scopeLabel}`,
      metadata: {
        scope: input.scope,
        scopeId: input.scopeId,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      },
    });

    setImmediate(() => {
      void this.runGeneration(job, user);
    });

    return { jobId: job.id, status: job.status };
  }

  getDownload(user: AuthUser, jobId: string) {
    const job = auditPacksDemoStore.get(user.tenantId, jobId);
    if (!job) {
      return null;
    }

    if (job.status !== "ready") {
      return { status: job.status, downloadUrl: null as string | null };
    }

    return {
      status: job.status,
      downloadUrl: `/api/v1/audit-packs/${jobId}/file`,
    };
  }

  getPdfBuffer(user: AuthUser, jobId: string) {
    const job = auditPacksDemoStore.get(user.tenantId, jobId);
    if (!job || job.status !== "ready") {
      return null;
    }
    return job.pdfBuffer ?? null;
  }

  private async runGeneration(job: AuditPackJob, user: AuthUser) {
    try {
      const pdfBuffer = await generateAuditPackPdf(job, {
        institutionName: "Ghana International School",
        generatedBy: user.email,
        generatedAt: new Date().toISOString(),
      });
      auditPacksDemoStore.markReady(job.id, pdfBuffer);
    } catch (error) {
      auditPacksDemoStore.markFailed(
        job.id,
        error instanceof Error ? error.message : "PDF generation failed",
      );
    }
  }

  async ensureReadyPdf(user: AuthUser, jobId: string) {
    const job = auditPacksDemoStore.get(user.tenantId, jobId);
    if (!job) {
      return null;
    }

    if (job.status === "ready" && job.pdfBuffer) {
      return job.pdfBuffer;
    }

    if (job.status === "ready" && !job.pdfBuffer) {
      const pdfBuffer = await generateAuditPackPdf(job, {
        institutionName: "Ghana International School",
        generatedBy: job.createdByName ?? job.createdBy,
        generatedAt: job.completedAt ?? job.createdAt,
      });
      auditPacksDemoStore.markReady(job.id, pdfBuffer);
      return pdfBuffer;
    }

    return null;
  }

  private resolveScopeLabel(tenantId: string, input: GeneratePackInput) {
    if (input.scope === "function" && input.scopeId) {
      const fn = demoSchoolScaffold().find((item) => item.id === input.scopeId);
      return fn?.name ?? input.scopeId;
    }

    if (input.scope === "process" && input.scopeId) {
      const process = processDemoStore.getProcess(tenantId, input.scopeId);
      if (process) {
        return `${process.processCode ?? process.id} — ${process.name}`;
      }
    }

    if (input.scope === "date_range") {
      return `Date range ${input.dateFrom ?? "start"} to ${input.dateTo ?? "now"}`;
    }

    if (input.scope === "incident" && input.scopeId) {
      return `Incident ${input.scopeId}`;
    }

    return input.scope;
  }
}
