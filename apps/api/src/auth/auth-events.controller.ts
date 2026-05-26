import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { AuthGuard } from "./auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthUser } from "./auth.types";

type FailedLoginDto = {
  email?: string;
  reason?: string;
};

@Controller("api/v1/auth/events")
export class AuthEventsController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Post("login")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async login(
    @CurrentUser() user: AuthUser,
    @Headers("user-agent") userAgent?: string,
  ) {
    const supabase = getSupabaseAdminClient();

    await supabase
      ?.from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id)
      .eq("tenant_id", user.tenantId);

    await this.audit.log(user, {
      eventType: "auth.login",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
      action: `${user.email} signed in`,
      metadata: { userAgent },
    });

    return { success: true, data: { logged: true } };
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logout(
    @CurrentUser() user: AuthUser,
    @Headers("user-agent") userAgent?: string,
  ) {
    await this.audit.log(user, {
      eventType: "auth.logout",
      entityType: "User",
      entityId: user.id,
      entityName: user.email,
      action: `${user.email} signed out`,
      metadata: { userAgent },
    });

    return { success: true, data: { logged: true } };
  }

  @Post("login-failed")
  @HttpCode(200)
  async loginFailed(
    @Body() dto: FailedLoginDto,
    @Headers("user-agent") userAgent?: string,
  ) {
    const supabase = getSupabaseAdminClient();
    const email = dto.email?.trim().toLowerCase();

    if (!supabase || !email) {
      return { success: true, data: { logged: false } };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, tenant_id, email")
      .eq("email", email)
      .maybeSingle<{ id: string; tenant_id: string; email: string }>();

    if (!profile) {
      return { success: true, data: { logged: false } };
    }

    await supabase.from("audit_log").insert({
      tenant_id: profile.tenant_id,
      event_type: "auth.login_failed",
      entity_type: "User",
      entity_id: profile.id,
      entity_name: profile.email,
      actor_id: profile.id,
      actor_name: profile.email,
      action: `Failed sign-in attempt for ${profile.email}`,
      metadata: {
        reason: dto.reason ?? "Invalid credentials",
        userAgent,
      },
    });

    return { success: true, data: { logged: true } };
  }
}
