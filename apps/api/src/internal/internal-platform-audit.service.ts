import { Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";
import { platformAuditDemoStore } from "./platform-audit-demo.store";

@Injectable()
export class InternalPlatformAuditService {
  async list(filters: {
    limit?: number;
    eventType?: string;
    entityType?: string;
  } = {}) {
    const limit = filters.limit ?? 100;

    if (usePlatformOpsDemoStore()) {
      return platformAuditDemoStore.list({
        limit,
        eventType: filters.eventType,
      });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return platformAuditDemoStore.list({ limit, eventType: filters.eventType });
    }

    let query = supabase
      .from("platform_audit_log")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (filters.eventType) {
      query = query.eq("event_type", filters.eventType);
    }
    if (filters.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      timestamp: row.timestamp as string,
      actorEmail: row.actor_email as string,
      eventType: row.event_type as string,
      entityType: row.entity_type as string,
      entityId: row.entity_id as string | undefined,
      entityName: row.entity_name as string | undefined,
      action: row.action as string,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
    }));
  }
}
