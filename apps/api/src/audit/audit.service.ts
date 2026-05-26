import { Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { AuthUser } from "../auth/auth.types";

type AuditEvent = {
  eventType: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  action: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  async log(user: AuthUser, event: AuditEvent) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return;
    }

    await supabase.from("audit_log").insert({
      tenant_id: user.tenantId,
      event_type: event.eventType,
      entity_type: event.entityType,
      entity_id: event.entityId,
      entity_name: event.entityName,
      actor_id: user.id,
      actor_name: user.email,
      action: event.action,
      before_state: event.beforeState,
      after_state: event.afterState,
      metadata: event.metadata ?? {},
    });
  }
}
