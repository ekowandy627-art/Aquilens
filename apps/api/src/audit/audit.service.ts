import { Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { AuthUser } from "../auth/auth.types";
import { isStaffOnlyReader } from "../processes/process-access";
import {
  auditDemoStore,
  type AuditListFilters,
  type AuditLogRecord,
} from "./audit-demo.store";

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

export type AuditListItem = {
  id: string;
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

@Injectable()
export class AuditService {
  canViewAllEvents(user: AuthUser) {
    return (
      user.permissions.includes("*") || user.permissions.includes("audit:read")
    );
  }

  async log(user: AuthUser, event: AuditEvent) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      auditDemoStore.insert({
        tenantId: user.tenantId,
        timestamp: new Date().toISOString(),
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        entityName: event.entityName,
        actorId: user.id,
        actorName: user.email,
        action: event.action,
        beforeState: event.beforeState,
        afterState: event.afterState,
        metadata: event.metadata ?? {},
      });
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

  async list(user: AuthUser, filters: AuditListFilters = {}) {
    const scopedFilters = this.applyRoleScope(user, filters);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      const result = auditDemoStore.list(user.tenantId, scopedFilters);
      return {
        items: result.items.map((entry) => this.toListItem(entry)),
        nextCursor: result.nextCursor,
        total: result.total,
      };
    }

    const limit = scopedFilters.limit ?? 50;
    let query = supabase
      .from("audit_log")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .order("timestamp", { ascending: false })
      .limit(limit + 1);

    if (scopedFilters.entityType && scopedFilters.entityType !== "All") {
      query = query.eq("entity_type", scopedFilters.entityType);
    }
    if (scopedFilters.entityId) {
      query = query.eq("entity_id", scopedFilters.entityId);
    }
    if (scopedFilters.actorId) {
      query = query.eq("actor_id", scopedFilters.actorId);
    }
    if (scopedFilters.eventType) {
      query = query.ilike("event_type", `%${scopedFilters.eventType}%`);
    }
    if (scopedFilters.dateFrom) {
      query = query.gte("timestamp", scopedFilters.dateFrom);
    }
    if (scopedFilters.dateTo) {
      query = query.lte("timestamp", scopedFilters.dateTo);
    }
    if (scopedFilters.actorScopeId) {
      query = query.eq("actor_id", scopedFilters.actorScopeId);
    }
    if (scopedFilters.cursor) {
      const cursorEntry = await supabase
        .from("audit_log")
        .select("timestamp")
        .eq("id", scopedFilters.cursor)
        .maybeSingle();
      if (cursorEntry.data?.timestamp) {
        query = query.lt("timestamp", cursorEntry.data.timestamp as string);
      }
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: page.map((row) => this.toListItemFromRow(row)),
      nextCursor: hasMore ? (page[page.length - 1]?.id as string) : undefined,
      total: page.length,
    };
  }

  async exportCsv(user: AuthUser, filters: AuditListFilters = {}) {
    const scopedFilters = this.applyRoleScope(user, filters);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return auditDemoStore.exportCsv(user.tenantId, scopedFilters);
    }

    const { items } = await this.list(user, { ...scopedFilters, limit: 10_000 });
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

  private applyRoleScope(user: AuthUser, filters: AuditListFilters): AuditListFilters {
    if (this.canViewAllEvents(user)) {
      return filters;
    }

    if (isStaffOnlyReader(user)) {
      return { ...filters, actorScopeId: user.id };
    }

    return { ...filters, actorScopeId: user.id };
  }

  private toListItem(entry: AuditLogRecord): AuditListItem {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.eventType,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityName: entry.entityName,
      actorId: entry.actorId,
      actorName: entry.actorName,
      action: entry.action,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      metadata: entry.metadata,
    };
  }

  private toListItemFromRow(row: Record<string, unknown>): AuditListItem {
    return {
      id: row.id as string,
      timestamp: row.timestamp as string,
      eventType: row.event_type as string,
      entityType: row.entity_type as string,
      entityId: (row.entity_id as string) ?? undefined,
      entityName: (row.entity_name as string) ?? undefined,
      actorId: (row.actor_id as string) ?? undefined,
      actorName: (row.actor_name as string) ?? undefined,
      action: row.action as string,
      beforeState: (row.before_state as Record<string, unknown>) ?? undefined,
      afterState: (row.after_state as Record<string, unknown>) ?? undefined,
      metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    };
  }
}

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
