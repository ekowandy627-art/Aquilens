import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
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
  @Post("login")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async login(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();

    await supabase
      ?.from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id)
      .eq("tenant_id", user.tenantId);

    return { success: true, data: { logged: true } };
  }

  @Post("logout")
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async logout() {
    return { success: true, data: { logged: true } };
  }

  /** Accepted for client compatibility; auth telemetry is not stored in the operational audit trail. */
  @Post("login-failed")
  @HttpCode(200)
  async loginFailed(@Body() dto: FailedLoginDto) {
    void dto;
    return { success: true, data: { logged: false } };
  }
}
