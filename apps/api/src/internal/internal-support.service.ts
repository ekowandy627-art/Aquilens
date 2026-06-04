import { HttpException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";
import { platformSupportDemoStore } from "./platform-support-demo.store";
import { platformAuditDemoStore } from "./platform-audit-demo.store";
import { InternalTenantsService } from "./internal-tenants.service";

export type SupportAccessInput = {
  tenantId: string;
  reason: string;
  platformEmail: string;
  platformUserId?: string;
};

@Injectable()
export class InternalSupportService {
  constructor(
    @Inject(InternalTenantsService)
    private readonly tenants: InternalTenantsService,
  ) {}

  async issueSupportAccess(input: SupportAccessInput) {
    const reason = input.reason.trim();
    if (!reason) {
      throw new HttpException("Reason is required", 422);
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase || usePlatformOpsDemoStore()) {
      return this.issueDemoAccess(input);
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, slug, name")
      .eq("id", input.tenantId)
      .maybeSingle<{ id: string; slug: string; name: string }>();

    if (!tenant) {
      throw new HttpException("Tenant not found", 404);
    }

    const supportEmail = `support+${tenant.slug}@platform.aquilens.internal`;
    const { data: supportUser } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", input.tenantId)
      .eq("email", supportEmail)
      .maybeSingle<{ id: string }>();

    if (!supportUser) {
      throw new HttpException("Support user not provisioned for tenant", 503);
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: supportEmail,
      });

    if (linkError || !linkData?.properties?.action_link) {
      throw new HttpException(
        linkError?.message ?? "Failed to generate magic link",
        500,
      );
    }

    await supabase.from("platform_support_access_log").insert({
      id: randomUUID(),
      tenant_id: input.tenantId,
      platform_user_id: input.platformUserId ?? null,
      platform_email: input.platformEmail,
      support_user_id: supportUser.id,
      reason,
      expires_at: expiresAt,
    });

    await supabase.from("audit_log").insert({
      tenant_id: input.tenantId,
      event_type: "platform.support_access",
      entity_type: "Tenant",
      entity_id: input.tenantId,
      entity_name: tenant.name,
      actor_id: supportUser.id,
      actor_name: "Aquilens Platform Support",
      action: `Aquilens support accessed workspace for: ${reason}`,
      metadata: {
        platformEmail: input.platformEmail,
        expiresAt,
      },
    });

    return {
      magicLink: linkData.properties.action_link,
      expiresAt,
    };
  }

  private issueDemoAccess(input: SupportAccessInput) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const magicLink = `https://demo.aquilens.internal/support/${input.tenantId}?token=demo-support`;

    platformSupportDemoStore.append({
      tenantId: input.tenantId,
      platformEmail: input.platformEmail,
      platformUserId: input.platformUserId,
      supportUserId: "demo-support-user",
      reason: input.reason.trim(),
      expiresAt,
    });

    platformAuditDemoStore.append({
      actorEmail: input.platformEmail,
      eventType: "platform.support_access",
      entityType: "Tenant",
      entityId: input.tenantId,
      action: `Aquilens support accessed workspace for: ${input.reason.trim()}`,
      metadata: { platformEmail: input.platformEmail, expiresAt },
    });

    return { magicLink, expiresAt };
  }
}
