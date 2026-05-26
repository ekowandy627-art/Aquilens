import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RequirePermission } from "../auth/require-permission.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import type { AuthUser } from "../auth/auth.types";

@Controller("api/v1/tenants")
@UseGuards(AuthGuard, PermissionGuard)
export class TenantsController {
  @Get("me")
  @RequirePermission("settings", "edit")
  me(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      data: {
        id: user.tenantId,
        name: "Ghana International School",
        slug: "gis",
        institutionType: "school",
        country: "Ghana",
      },
    };
  }
}
