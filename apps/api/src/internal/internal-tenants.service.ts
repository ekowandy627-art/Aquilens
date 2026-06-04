import { HttpException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { TenantPlatformConfigService } from "../platform-ops/tenant-platform-config.service";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";
import { AiUsageService } from "../platform-ops/ai-usage.service";
import { demoSchoolScaffold } from "../tenants/demo-scaffold";

type InstitutionType =
  | "school"
  | "hospital"
  | "financial_services"
  | "ngo"
  | "corporate"
  | "government"
  | "other";

export type TenantLookupResult = {
  tenantId: string;
  slug: string;
  name: string;
  status: "active" | "suspended";
  institutionType: InstitutionType;
  country: string;
};

export type OnboardTenantDto = {
  name: string;
  slug: string;
  institutionType: InstitutionType;
  country: string;
  adminEmail: string;
  adminFullName: string;
  adminPassword?: string;
};

const DEMO_TENANTS: TenantLookupResult[] = [
  {
    tenantId: "00000000-0000-4000-8000-000000000001",
    slug: "gis",
    name: "Ghana International School",
    status: "active",
    institutionType: "school",
    country: "Ghana",
  },
  {
    tenantId: "00000000-0000-4000-8000-000000000002",
    slug: "demo-hospital",
    name: "Demo Hospital",
    status: "active",
    institutionType: "hospital",
    country: "Ghana",
  },
];

const ROLE_TEMPLATES = [
  {
    name: "Super Admin",
    systemKey: "super-admin",
    permissions: [
      "users:read",
      "users:invite",
      "users:edit",
      "users:assign_roles",
      "roles:manage",
      "settings:edit",
      "tenant_scaffold:read",
      "tenant_scaffold:manage",
      "access_reviews:read",
      "access_reviews:manage",
      "standards:read",
      "standards:manage",
      "audit:read",
      "audit_packs:generate",
      "processes:create",
      "processes:read",
      "processes:edit",
      "processes:approve",
      "workflows:read",
      "workflows:complete",
      "agents:read",
    ],
  },
  {
    name: "Compliance Officer",
    systemKey: "compliance-officer",
    permissions: [
      "processes:read",
      "workflows:read",
      "agents:read",
      "audit:read",
      "audit_packs:generate",
      "users:read",
      "tenant_scaffold:read",
      "access_reviews:read",
      "access_reviews:manage",
      "standards:read",
    ],
  },
  {
    name: "Staff",
    systemKey: "staff",
    permissions: ["processes:read", "training:complete"],
  },
  {
    name: "Aquilens Support",
    systemKey: "aquilens-support",
    permissions: [
      "processes:read",
      "workflows:read",
      "audit:read",
      "standards:read",
      "agents:read",
      "incidents:read",
      "users:read",
    ],
  },
];

export const AQUILENS_SUPPORT_SYSTEM_KEY = "aquilens-support";

export function supportUserEmailForSlug(slug: string) {
  return `support+${slug}@platform.aquilens.internal`;
}

@Injectable()
export class InternalTenantsService {
  constructor(
    @Inject(TenantPlatformConfigService)
    private readonly platformConfig: TenantPlatformConfigService,
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
  ) {}
  lookupBySlug(slug: string): TenantLookupResult | null {
    const normalized = slug.trim().toLowerCase();
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return (
        DEMO_TENANTS.find((tenant) => tenant.slug === normalized) ?? null
      );
    }

    return null;
  }

  async lookupBySlugAsync(slug: string): Promise<TenantLookupResult | null> {
    const normalized = slug.trim().toLowerCase();
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return this.lookupBySlug(normalized);
    }

    const { data } = await supabase
      .from("tenants")
      .select("id, name, slug, institution_type, country, status")
      .eq("slug", normalized)
      .maybeSingle<{
        id: string;
        name: string;
        slug: string;
        institution_type: InstitutionType;
        country: string;
        status: "active" | "suspended";
      }>();

    if (!data) {
      return null;
    }

    return {
      tenantId: data.id,
      slug: data.slug,
      name: data.name,
      status: data.status,
      institutionType: data.institution_type,
      country: data.country,
    };
  }

  async listTenants() {
    const supabase = getSupabaseAdminClient();

    if (!supabase || usePlatformOpsDemoStore()) {
      const items = await Promise.all(
        DEMO_TENANTS.map(async (tenant) => {
          const config = await this.platformConfig.getConfig(tenant.tenantId);
          const mtdCostUsd = await this.aiUsage.getMtdCostUsd(tenant.tenantId);
          return {
            ...tenant,
            createdAt: new Date().toISOString(),
            userCount: 0,
            mtdCostUsd,
            aiBudgetUsd: config?.aiMonthlyBudgetUsd ?? null,
            lifecycleState: config?.lifecycleState ?? "active",
            healthScore: null,
          };
        }),
      );
      return items;
    }

    const { data: tenants } = await supabase
      .from("tenants")
      .select("id, name, slug, institution_type, country, status, created_at")
      .order("name");

    const rows = tenants ?? [];
    const counts = await Promise.all(
      rows.map(async (tenant) => {
        const { count } = await supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenant.id);
        return count ?? 0;
      }),
    );

    return rows.map((tenant, index) => ({
      tenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status as "active" | "suspended",
      institutionType: tenant.institution_type as InstitutionType,
      country: tenant.country,
      createdAt: tenant.created_at as string,
      userCount: counts[index] ?? 0,
      mtdCostUsd: 0,
      aiBudgetUsd: null,
      lifecycleState: "active",
      healthScore: null,
    }));
  }

  async patchPlatformConfig(
    tenantId: string,
    patch: {
      aiMonthlyBudgetUsd?: number | null;
      markupMultiplier?: number | null;
      lifecycleState?: "trial" | "active" | "suspended" | "offboarding";
      featureFlags?: Record<string, boolean>;
      planLabel?: string;
      notes?: string;
    },
  ) {
    const config = await this.platformConfig.upsertConfig(tenantId, patch);
    return config;
  }

  async updateTenantStatus(tenantId: string, status: "active" | "suspended") {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const tenant = DEMO_TENANTS.find((row) => row.tenantId === tenantId);
      if (!tenant) {
        throw new HttpException("Tenant not found", 404);
      }
      tenant.status = status;
      return tenant;
    }

    const { data, error } = await supabase
      .from("tenants")
      .update({ status })
      .eq("id", tenantId)
      .select("id, name, slug, status")
      .maybeSingle();

    if (error || !data) {
      throw new HttpException(error?.message ?? "Tenant not found", 404);
    }

    return data;
  }

  async onboardTenant(dto: OnboardTenantDto) {
    const slug = dto.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new HttpException("Slug must be lowercase letters, numbers, and hyphens", 422);
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      throw new HttpException(
        "Tenant onboarding requires Supabase (demo tenants are pre-seeded)",
        503,
      );
    }

    const existing = await this.lookupBySlugAsync(slug);
    if (existing) {
      throw new HttpException("Tenant slug already exists", 409);
    }

    const tenantId = randomUUID();
    const password = dto.adminPassword ?? "Aquilens2024!";

    await supabase.from("tenants").insert({
      id: tenantId,
      name: dto.name.trim(),
      slug,
      institution_type: dto.institutionType,
      country: dto.country.trim(),
      status: "active",
      settings: { onboarding_complete: false },
    });

    await this.seedRoles(supabase, tenantId);
    await this.seedScaffold(supabase, tenantId, dto.institutionType);

    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: dto.adminEmail.trim().toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { full_name: dto.adminFullName.trim() },
      });

    if (authError || !authUser.user) {
      throw new HttpException(authError?.message ?? "Failed to create admin user", 500);
    }

    await supabase.from("users").insert({
      id: authUser.user.id,
      tenant_id: tenantId,
      full_name: dto.adminFullName.trim(),
      email: dto.adminEmail.trim().toLowerCase(),
      status: "active",
    });

    const { data: superAdminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("system_key", "super-admin")
      .maybeSingle<{ id: string }>();

    if (superAdminRole) {
      await supabase.from("user_roles").insert({
        user_id: authUser.user.id,
        role_id: superAdminRole.id,
        tenant_id: tenantId,
      });
    }

    await this.platformConfig.upsertConfig(tenantId, {
      aiMonthlyBudgetUsd: null,
      lifecycleState: "trial",
    });

    const support = await this.provisionSupportUser(supabase, tenantId, slug);

    return {
      tenantId,
      slug,
      name: dto.name.trim(),
      adminEmail: dto.adminEmail.trim().toLowerCase(),
      temporaryPassword: dto.adminPassword ? undefined : password,
      supportEmail: support.email,
    };
  }

  async provisionSupportUser(
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
    tenantId: string,
    slug: string,
  ) {
    const email = supportUserEmailForSlug(slug);
    const { data: existing } = await supabase
      .from("users")
      .select("id, email")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .maybeSingle<{ id: string; email: string }>();

    if (existing) {
      return { userId: existing.id, email: existing.email };
    }

    const supportPassword = randomUUID();
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password: supportPassword,
        email_confirm: true,
        user_metadata: { full_name: "Aquilens Platform Support" },
      });

    if (authError || !authUser.user) {
      throw new HttpException(
        authError?.message ?? "Failed to create support user",
        500,
      );
    }

    await supabase.from("users").insert({
      id: authUser.user.id,
      tenant_id: tenantId,
      full_name: "Aquilens Platform Support",
      email,
      status: "active",
    });

    const { data: supportRole } = await supabase
      .from("roles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("system_key", AQUILENS_SUPPORT_SYSTEM_KEY)
      .maybeSingle<{ id: string }>();

    if (supportRole) {
      await supabase.from("user_roles").insert({
        user_id: authUser.user.id,
        role_id: supportRole.id,
        tenant_id: tenantId,
      });
    }

    return { userId: authUser.user.id, email };
  }

  private async seedRoles(
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
    tenantId: string,
  ) {
    const { data: permissions } = await supabase
      .from("permissions")
      .select("id, resource, action");

    const permissionMap = new Map(
      (permissions ?? []).map((row) => [`${row.resource}:${row.action}`, row.id as string]),
    );

    for (const template of ROLE_TEMPLATES) {
      const roleId = randomUUID();
      await supabase.from("roles").insert({
        id: roleId,
        tenant_id: tenantId,
        name: template.name,
        is_system: true,
        system_key: template.systemKey,
      });

      for (const perm of template.permissions) {
        const permissionId = permissionMap.get(perm);
        if (!permissionId) continue;
        await supabase.from("role_permissions").insert({
          role_id: roleId,
          permission_id: permissionId,
          scope: "global",
        });
      }
    }
  }

  private async seedScaffold(
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
    tenantId: string,
    institutionType: InstitutionType,
  ) {
    const scaffold =
      institutionType === "school"
        ? demoSchoolScaffold()
        : institutionType === "hospital"
          ? [
              {
                name: "Clinical",
                areas: [{ name: "Admissions" }, { name: "Emergency" }],
              },
            ]
          : [{ name: "Operations", areas: [{ name: "General" }] }];

    for (const [functionIndex, fn] of scaffold.entries()) {
      const functionId = randomUUID();
      await supabase.from("tenant_functions").insert({
        id: functionId,
        tenant_id: tenantId,
        name: fn.name,
        sort_order: functionIndex,
        status: "active",
      });

      for (const [areaIndex, area] of fn.areas.entries()) {
        await supabase.from("tenant_process_areas").insert({
          id: randomUUID(),
          tenant_id: tenantId,
          function_id: functionId,
          name: area.name,
          sort_order: areaIndex,
        });
      }
    }
  }
}
