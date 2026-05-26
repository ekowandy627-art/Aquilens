import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RequirePermission } from "../auth/require-permission.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";

@Controller("api/v1/tenants")
@UseGuards(AuthGuard, PermissionGuard)
export class TenantsController {
  @Get("me")
  @RequirePermission("settings", "edit")
  async me(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name, slug, institution_type, country")
        .eq("id", user.tenantId)
        .maybeSingle();

      if (tenant) {
        return {
          success: true,
          data: {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            institutionType: tenant.institution_type,
            country: tenant.country,
          },
        };
      }
    }

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
