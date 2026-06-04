import { Body, Controller, Get, Inject, Put, UseGuards } from "@nestjs/common";
import { randomUUID } from "crypto";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RequirePermission } from "../auth/require-permission.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { demoScaffoldForTenant } from "./demo-scaffold";
import { normalizeJurisdictionList } from "@aquilens/shared";

type InstitutionType =
  | "school"
  | "hospital"
  | "financial_services"
  | "ngo"
  | "corporate"
  | "government";

type ProcessAreaDto = {
  id?: string;
  name: string;
  description?: string;
};

type FunctionDto = {
  id?: string;
  name: string;
  description?: string;
  ownerId?: string;
  areas: ProcessAreaDto[];
};

type TenantProfileDto = {
  name: string;
  institutionType: InstitutionType;
  country: string;
  operatingJurisdictions?: string[];
  outputMarketJurisdictions?: string[];
  onboardingComplete: boolean;
  functions: FunctionDto[];
};

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  institution_type: InstitutionType;
  country: string;
  operating_jurisdictions?: string[] | null;
  output_market_jurisdictions?: string[] | null;
  settings: Record<string, unknown> | null;
};

type FunctionRow = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  sort_order: number;
  tenant_process_areas: Array<{
    id: string;
    name: string;
    description: string | null;
    sort_order: number;
  }>;
};

@Controller("api/v1/tenants")
@UseGuards(AuthGuard, PermissionGuard)
export class TenantsController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get("me")
  @RequirePermission("settings", "edit")
  async me(@CurrentUser() user: AuthUser) {
    const profile = await this.getTenantProfile(user);

    return {
      success: true,
      data: {
        id: user.tenantId,
        name: profile.name,
        slug: profile.slug,
        institutionType: profile.institutionType,
        country: profile.country,
      },
    };
  }

  @Get("profile")
  @RequirePermission("tenant_scaffold", "read")
  async profile(@CurrentUser() user: AuthUser) {
    return { success: true, data: await this.getTenantProfile(user) };
  }

  @Put("profile")
  @RequirePermission("tenant_scaffold", "manage")
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: TenantProfileDto,
  ) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: true, data: dto };
    }

    const beforeState = await this.getTenantProfile(user);
    const settings = {
      onboarding_complete: dto.onboardingComplete,
    };

    const operatingJurisdictions = normalizeJurisdictionList(
      dto.operatingJurisdictions,
    );
    const outputMarketJurisdictions = normalizeJurisdictionList(
      dto.outputMarketJurisdictions,
    );

    await supabase
      .from("tenants")
      .update({
        name: dto.name,
        institution_type: dto.institutionType,
        country: dto.country,
        operating_jurisdictions: operatingJurisdictions,
        output_market_jurisdictions: outputMarketJurisdictions,
        settings,
      })
      .eq("id", user.tenantId);

    await supabase
      .from("tenant_process_areas")
      .delete()
      .eq("tenant_id", user.tenantId);
    await supabase
      .from("tenant_functions")
      .delete()
      .eq("tenant_id", user.tenantId);

    for (const [functionIndex, fn] of dto.functions.entries()) {
      const functionId = uuidOrNew(fn.id);

      await supabase.from("tenant_functions").insert({
        id: functionId,
        tenant_id: user.tenantId,
        name: fn.name,
        description: fn.description,
        owner_id: fn.ownerId ?? null,
        sort_order: functionIndex,
      });

      for (const [areaIndex, area] of fn.areas.entries()) {
        await supabase.from("tenant_process_areas").insert({
          id: uuidOrNew(area.id),
          tenant_id: user.tenantId,
          function_id: functionId,
          name: area.name,
          description: area.description,
          sort_order: areaIndex,
        });
      }
    }

    const afterState = await this.getTenantProfile(user);

    await this.audit.log(user, {
      eventType: "tenant.scaffold_updated",
      entityType: "Tenant",
      entityId: user.tenantId,
      entityName: dto.name,
      action: `Updated tenant scaffold for ${dto.name}`,
      beforeState,
      afterState,
      metadata: {
        functions: dto.functions.length,
        processAreas: dto.functions.reduce(
          (total, fn) => total + fn.areas.length,
          0,
        ),
      },
    });

    return { success: true, data: afterState };
  }

  private async getTenantProfile(user: AuthUser) {
    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select(
          "id, name, slug, institution_type, country, operating_jurisdictions, output_market_jurisdictions, settings",
        )
        .eq("id", user.tenantId)
        .maybeSingle<TenantRow>();

      if (tenant) {
        const { data: functions } = await supabase
          .from("tenant_functions")
          .select(
            "id, name, description, owner_id, sort_order, tenant_process_areas(id, name, description, sort_order)",
          )
          .eq("tenant_id", user.tenantId)
          .eq("status", "active")
          .order("sort_order")
          .returns<FunctionRow[]>();

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          institutionType: tenant.institution_type,
          country: tenant.country,
          operatingJurisdictions: normalizeJurisdictionList(
            tenant.operating_jurisdictions ?? undefined,
          ),
          outputMarketJurisdictions: normalizeJurisdictionList(
            tenant.output_market_jurisdictions ?? undefined,
          ),
          onboardingComplete: Boolean(
            tenant.settings?.onboarding_complete ?? false,
          ),
          functions: (functions ?? [])
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((fn) => ({
              id: fn.id,
              name: fn.name,
              description: fn.description ?? undefined,
              ownerId: fn.owner_id ?? undefined,
              areas: (fn.tenant_process_areas ?? [])
                .sort((first, second) => first.sort_order - second.sort_order)
                .map((area) => ({
                  id: area.id,
                  name: area.name,
                  description: area.description ?? undefined,
                })),
            })),
        };
      }
    }

    const isMfg = user.tenantId === "tenant-mfg";
    return {
      id: user.tenantId,
      name: isMfg ? "Acme Foods Manufacturing" : "Ghana International School",
      slug: isMfg ? "mfg" : "gis",
      institutionType: (isMfg ? "corporate" : "school") as InstitutionType,
      country: isMfg ? "Ghana" : "Ghana",
      operatingJurisdictions: isMfg
        ? (["ghana", "eu"] as const)
        : (["ghana"] as const),
      outputMarketJurisdictions: isMfg
        ? (["uk", "eu"] as const)
        : (["ghana", "uk"] as const),
      onboardingComplete: true,
      functions: demoScaffoldForTenant(user.tenantId),
    };
  }
}

function uuidOrNew(value?: string) {
  return isUuid(value) ? value : randomUUID();
}

function isUuid(value?: string) {
  return Boolean(
    value?.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ),
  );
}
