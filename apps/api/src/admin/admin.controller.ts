import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { listDemoUsers } from "../auth/demo-users";
import { AuditService } from "../audit/audit.service";

type InviteUserDto = {
  email: string;
  fullName: string;
  roleId: string;
  password?: string;
};

type CreateRoleDto = {
  name: string;
  description?: string;
  permissionIds: string[];
};

type AccessReviewDecisionDto = {
  decision: "confirmed" | "revoked";
  notes?: string;
};

@Controller("api/v1")
@UseGuards(AuthGuard, PermissionGuard)
export class AdminController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get("users")
  @RequirePermission("users", "read")
  async users(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: true, data: listDemoUsers(user.tenantId) };
    }

    const { data } = await supabase
      .from("users")
      .select(
        "id, full_name, email, status, last_login_at, user_roles!user_roles_user_id_fkey(role_id)",
      )
      .eq("tenant_id", user.tenantId)
      .order("full_name");

    return { success: true, data: data ?? [] };
  }

  @Post("auth/invite")
  @RequirePermission("users", "invite")
  async invite(@CurrentUser() user: AuthUser, @Body() dto: InviteUserDto) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    const password = dto.password ?? "Aquilens2024!";
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: dto.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.fullName,
          tenant_id: user.tenantId,
        },
      });

    if (authError) {
      return {
        success: false,
        error: { code: "INVITE_FAILED", message: authError.message, status: 422 },
      };
    }

    await supabase.from("users").upsert(
      {
        id: authUser.user.id,
        tenant_id: user.tenantId,
        full_name: dto.fullName,
        email: dto.email,
        status: "active",
      },
      { onConflict: "id" },
    );

    await supabase.from("user_roles").upsert(
      {
        user_id: authUser.user.id,
        role_id: dto.roleId,
        tenant_id: user.tenantId,
        assigned_by: user.id,
      },
      { onConflict: "user_id,role_id,tenant_id" },
    );

    await this.audit.log(user, {
      eventType: "auth.invite_sent",
      entityType: "User",
      entityId: authUser.user.id,
      entityName: dto.email,
      action: `Invited ${dto.email}`,
      afterState: { email: dto.email, roleId: dto.roleId },
    });

    return { success: true, data: { id: authUser.user.id, email: dto.email } };
  }

  @Post("users/:id/reset-password")
  @RequirePermission("users", "edit")
  async resetPassword(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    const { data: targetUser, error: lookupError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", id)
      .eq("tenant_id", user.tenantId)
      .maybeSingle<{ id: string; email: string; full_name: string }>();

    if (lookupError || !targetUser) {
      return {
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: lookupError?.message ?? "User not found",
          status: 404,
        },
      };
    }

    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email: targetUser.email,
      });

    if (linkError || !linkData?.properties?.action_link) {
      return {
        success: false,
        error: {
          code: "RESET_FAILED",
          message: linkError?.message ?? "Failed to generate password reset link",
          status: 500,
        },
      };
    }

    await this.audit.log(user, {
      eventType: "auth.password_reset_sent",
      entityType: "User",
      entityId: targetUser.id,
      entityName: targetUser.email,
      action: `Sent password reset link to ${targetUser.email}`,
    });

    return {
      success: true,
      data: {
        id: targetUser.id,
        email: targetUser.email,
        resetLink: linkData.properties.action_link,
      },
    };
  }

  @Patch("users/:id/deactivate")
  @RequirePermission("users", "edit")
  async deactivate(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    await supabase
      .from("users")
      .update({ status: "deactivated" })
      .eq("id", id)
      .eq("tenant_id", user.tenantId);

    await supabase.auth.admin.updateUserById(id, { ban_duration: "876000h" });

    await this.audit.log(user, {
      eventType: "user.deactivated",
      entityType: "User",
      entityId: id,
      action: `Deactivated user ${id}`,
    });

    return { success: true, data: { id, status: "deactivated" } };
  }

  @Get("permissions")
  @RequirePermission("roles", "manage")
  async permissions() {
    const supabase = getSupabaseAdminClient();
    const { data } = supabase
      ? await supabase
          .from("permissions")
          .select("id, resource, action, description")
          .order("resource")
          .order("action")
      : { data: [] };

    return { success: true, data: data ?? [] };
  }

  @Get("roles")
  @RequirePermission("roles", "manage")
  async roles(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    const { data } = supabase
      ? await supabase
          .from("roles")
          .select("id, name, description, is_system")
          .eq("tenant_id", user.tenantId)
          .order("name")
      : { data: [] };

    return { success: true, data: data ?? [] };
  }

  @Post("roles")
  @RequirePermission("roles", "manage")
  async createRole(@CurrentUser() user: AuthUser, @Body() dto: CreateRoleDto) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    const roleId = randomUUID();
    await supabase.from("roles").insert({
      id: roleId,
      tenant_id: user.tenantId,
      name: dto.name,
      description: dto.description,
      is_system: false,
    });

    for (const permissionId of dto.permissionIds) {
      await supabase.from("role_permissions").insert({
        role_id: roleId,
        permission_id: permissionId,
        scope: "global",
      });
    }

    await this.audit.log(user, {
      eventType: "user.role_assigned",
      entityType: "Role",
      entityId: roleId,
      entityName: dto.name,
      action: `Created custom role ${dto.name}`,
      afterState: dto,
    });

    return { success: true, data: { id: roleId, name: dto.name } };
  }

  @Get("access-reviews")
  @RequirePermission("access_reviews", "read")
  async accessReviews(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();
    const { data } = supabase
      ? await supabase
          .from("access_reviews")
          .select("id, status, initiated_at, completed_at, notes")
          .eq("tenant_id", user.tenantId)
          .order("initiated_at", { ascending: false })
      : { data: [] };

    return { success: true, data: data ?? [] };
  }

  @Post("access-reviews")
  @RequirePermission("access_reviews", "manage")
  async createAccessReview(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    const reviewId = randomUUID();
    await supabase.from("access_reviews").insert({
      id: reviewId,
      tenant_id: user.tenantId,
      initiated_by: user.id,
    });

    const { data: users } = await supabase
      .from("users")
      .select("id, email, full_name, user_roles!user_roles_user_id_fkey(role_id)")
      .eq("tenant_id", user.tenantId)
      .eq("status", "active");

    for (const reviewedUser of users ?? []) {
      await supabase.from("access_review_items").insert({
        access_review_id: reviewId,
        user_id: reviewedUser.id,
        roles_at_review: reviewedUser.user_roles ?? [],
      });
    }

    await this.audit.log(user, {
      eventType: "access_review.created",
      entityType: "AccessReview",
      entityId: reviewId,
      action: "Started access review",
    });

    return { success: true, data: { id: reviewId } };
  }

  @Get("access-reviews/:id")
  @RequirePermission("access_reviews", "read")
  async accessReview(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: true, data: null };
    }

    const { data: review } = await supabase
      .from("access_reviews")
      .select(
        "id, status, initiated_at, completed_at, notes, access_review_items(id, user_id, roles_at_review, decision, notes, users!access_review_items_user_id_fkey(email, full_name, status))",
      )
      .eq("tenant_id", user.tenantId)
      .eq("id", id)
      .maybeSingle();

    return { success: true, data: review };
  }

  @Patch("access-reviews/:id/items/:itemId")
  @RequirePermission("access_reviews", "manage")
  async decideAccessReviewItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: AccessReviewDecisionDto,
  ) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    await supabase
      .from("access_review_items")
      .update({
        decision: dto.decision,
        notes: dto.notes,
        decided_by: user.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", itemId);

    await this.audit.log(user, {
      eventType: "access_review.item_decided",
      entityType: "AccessReview",
      entityId: id,
      action: `Marked access review item ${dto.decision}`,
      metadata: { itemId, decision: dto.decision },
    });

    return { success: true, data: { id: itemId, decision: dto.decision } };
  }

  @Post("access-reviews/:id/complete")
  @RequirePermission("access_reviews", "manage")
  async completeAccessReview(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } };
    }

    await supabase
      .from("access_reviews")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", user.tenantId);

    await this.audit.log(user, {
      eventType: "access_review.completed",
      entityType: "AccessReview",
      entityId: id,
      action: "Completed access review",
    });

    return { success: true, data: { id, status: "completed" } };
  }
}
