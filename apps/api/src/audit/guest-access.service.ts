import { Inject, Injectable } from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { demoSchoolScaffold } from "../tenants/demo-scaffold";
import { processDemoStore } from "../processes/process-demo.store";
import { AuditService } from "./audit.service";
import {
  guestAccessDemoStore,
  type GuestAccessRecord,
} from "./guest-access-demo.store";

type CreateGuestAccessInput = {
  scope: GuestAccessRecord["scope"];
  scopeId?: string;
  expiresAt: string;
  auditorEmail: string;
};

@Injectable()
export class GuestAccessService {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  list(user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return guestAccessDemoStore.list(user.tenantId).map((grant) => this.toSummary(grant));
    }
    return guestAccessDemoStore.list(user.tenantId).map((grant) => this.toSummary(grant));
  }

  async create(user: AuthUser, input: CreateGuestAccessInput) {
    const scopeLabel = this.resolveScopeLabel(user.tenantId, input);
    const supabase = getSupabaseAdminClient();

    const grant = supabase
      ? guestAccessDemoStore.create({
          tenantId: user.tenantId,
          scope: input.scope,
          scopeId: input.scopeId,
          scopeLabel,
          auditorEmail: input.auditorEmail,
          expiresAt: input.expiresAt,
          createdBy: user.id,
        })
      : guestAccessDemoStore.create({
          tenantId: user.tenantId,
          scope: input.scope,
          scopeId: input.scopeId,
          scopeLabel,
          auditorEmail: input.auditorEmail,
          expiresAt: input.expiresAt,
          createdBy: user.id,
        });

    await this.audit.log(user, {
      eventType: "guest_access.created",
      entityType: "GuestAccess",
      entityId: grant.id,
      entityName: input.auditorEmail,
      action: "Created external auditor guest access",
      metadata: {
        scope: input.scope,
        scopeId: input.scopeId,
        auditorEmail: input.auditorEmail,
        expiresAt: input.expiresAt,
      },
    });

    const accessUrl = `/guest-access/view?token=${grant.token}`;

    return {
      id: grant.id,
      accessUrl,
      token: grant.token,
      scope: grant.scope,
      scopeId: grant.scopeId,
      scopeLabel: grant.scopeLabel,
      auditorEmail: grant.auditorEmail,
      expiresAt: grant.expiresAt,
      status: grant.status,
    };
  }

  async revoke(user: AuthUser, id: string) {
    const supabase = getSupabaseAdminClient();
    const grant = supabase
      ? guestAccessDemoStore.revoke(user.tenantId, id)
      : guestAccessDemoStore.revoke(user.tenantId, id);

    if (!grant) {
      return null;
    }

    await this.audit.log(user, {
      eventType: "guest_access.revoked",
      entityType: "GuestAccess",
      entityId: grant.id,
      entityName: grant.auditorEmail,
      action: "Revoked external auditor guest access",
    });

    return this.toSummary(grant);
  }

  validateToken(token: string) {
    const result = guestAccessDemoStore.getByToken(token);
    if (!result) {
      return { valid: false as const, error: "Invalid access token" };
    }
    if (result.error) {
      return { valid: false as const, error: result.error };
    }
    return {
      valid: true as const,
      grant: this.toSummary(result.grant),
    };
  }

  private toSummary(grant: GuestAccessRecord) {
    const now = new Date().toISOString();
    const status =
      grant.status === "active" && grant.expiresAt < now ? "expired" : grant.status;

    return {
      id: grant.id,
      scope: grant.scope,
      scopeId: grant.scopeId,
      scopeLabel: grant.scopeLabel,
      auditorEmail: grant.auditorEmail,
      expiresAt: grant.expiresAt,
      status,
      createdAt: grant.createdAt,
    };
  }

  private resolveScopeLabel(tenantId: string, input: CreateGuestAccessInput) {
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
    return input.scopeId ?? input.scope;
  }
}
