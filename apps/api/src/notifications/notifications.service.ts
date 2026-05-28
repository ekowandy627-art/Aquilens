import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { notificationDemoStore } from "./notification-demo.store";
import type { CreateNotificationDto, NotificationRecord } from "./notification.types";

@Injectable()
export class NotificationsService {
  async create(dto: CreateNotificationDto): Promise<NotificationRecord> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return notificationDemoStore.create(dto);
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        id,
        tenant_id: dto.tenantId,
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        entity_type: dto.entityType ?? null,
        entity_id: dto.entityId ?? null,
        entity_name: dto.entityName ?? null,
        is_read: false,
        created_at: now,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.fromRow(data);
  }

  async list(
    user: AuthUser,
    filters: { isRead?: boolean; type?: string } = {},
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return notificationDemoStore.listForUser(user.tenantId, user.id, filters);
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filters.isRead !== undefined) {
      query = query.eq("is_read", filters.isRead);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.fromRow(row));
  }

  async unreadCount(user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return notificationDemoStore.unreadCount(user.tenantId, user.id);
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.tenantId)
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  async markRead(user: AuthUser, id: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const updated = notificationDemoStore.markRead(user.tenantId, user.id, id);
      if (!updated) {
        return null;
      }
      return updated;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .eq("tenant_id", user.tenantId)
      .eq("user_id", user.id)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }

    return this.fromRow(data);
  }

  async markAllRead(user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return notificationDemoStore.markAllRead(user.tenantId, user.id);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: now })
      .eq("tenant_id", user.tenantId)
      .eq("user_id", user.id)
      .eq("is_read", false)
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    return data?.length ?? 0;
  }

  private fromRow(row: Record<string, unknown>): NotificationRecord {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      userId: row.user_id as string,
      type: row.type as string,
      title: row.title as string,
      body: (row.body as string) ?? undefined,
      entityType: (row.entity_type as string) ?? undefined,
      entityId: (row.entity_id as string) ?? undefined,
      entityName: (row.entity_name as string) ?? undefined,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at as string,
      readAt: (row.read_at as string) ?? undefined,
    };
  }
}
