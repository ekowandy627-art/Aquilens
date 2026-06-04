import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InternalGuard } from "./internal.guard";
import {
  InternalTenantsService,
  type OnboardTenantDto,
} from "./internal-tenants.service";
import { InternalGuidanceService } from "./internal-guidance.service";
import { InternalCronService } from "./internal-cron.service";
import { InternalMetricsService } from "./internal-metrics.service";
import { InternalSupportService } from "./internal-support.service";
import { InternalPlatformAuditService } from "./internal-platform-audit.service";
import { InternalPlatformAgentsService } from "./internal-platform-agents.service";
import { InternalTenantAgentsService } from "./internal-tenant-agents.service";
import { resolveDemoUser } from "../auth/demo-users";

@Controller("api/internal")
@UseGuards(InternalGuard)
export class InternalController {
  constructor(
    @Inject(InternalTenantsService)
    private readonly tenants: InternalTenantsService,
    @Inject(InternalGuidanceService)
    private readonly guidance: InternalGuidanceService,
    @Inject(InternalCronService)
    private readonly cron: InternalCronService,
    @Inject(InternalMetricsService)
    private readonly metrics: InternalMetricsService,
    @Inject(InternalSupportService)
    private readonly support: InternalSupportService,
    @Inject(InternalPlatformAuditService)
    private readonly platformAudit: InternalPlatformAuditService,
    @Inject(InternalPlatformAgentsService)
    private readonly platformAgents: InternalPlatformAgentsService,
    @Inject(InternalTenantAgentsService)
    private readonly tenantAgents: InternalTenantAgentsService,
  ) {}

  @Post("cron/attestation-due")
  async attestationDueCron() {
    const actor = resolveDemoUser("demo:user-gis-compliance");
    const data = await this.cron.runAttestationDueCron(actor);
    return { success: true, data };
  }

  @Post("cron/readiness-notifications")
  async readinessCron() {
    const actor = resolveDemoUser("demo:user-gis-compliance");
    const data = await this.cron.runReadinessNotifications(actor);
    return { success: true, data };
  }

  @Post("cron/standards-watch")
  async standardsWatchCron() {
    const data = this.cron.runStandardsWatch();
    return { success: true, data };
  }

  @Get("metrics/overview")
  async metricsOverview() {
    const data = await this.metrics.getOverview();
    return { success: true, data };
  }

  @Get("metrics/tenants")
  async metricsTenants() {
    const items = await this.metrics.listTenantMetrics();
    return { success: true, data: { items } };
  }

  @Get("metrics/tenants/:tenantId")
  async metricsTenantDetail(@Param("tenantId") tenantId: string) {
    const data = await this.metrics.getTenantMetrics(tenantId);
    return { success: true, data };
  }

  @Get("metrics/benchmarks")
  async metricsBenchmarks() {
    const data = await this.metrics.getBenchmarks();
    return { success: true, data };
  }

  @Get("ai-usage")
  async listAiUsage(
    @Query("tenantId") tenantId?: string,
    @Query("platformAgentKey") platformAgentKey?: string,
    @Query("limit") limit?: string,
  ) {
    const items = await this.metrics.listAiUsage({
      tenantId,
      platformAgentKey,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data: { items } };
  }

  @Get("platform-agents")
  async listPlatformAgents() {
    const items = await this.platformAgents.listAgents();
    return { success: true, data: { items } };
  }

  @Get("platform-agents/:agentKey")
  async getPlatformAgent(@Param("agentKey") agentKey: string) {
    const data = await this.platformAgents.getAgent(agentKey);
    return { success: true, data };
  }

  @Get("platform-agents/:agentKey/usage")
  async getPlatformAgentUsage(@Param("agentKey") agentKey: string) {
    const data = await this.platformAgents.getAgentUsage(agentKey);
    return { success: true, data };
  }

  @Get("tenant-agents/summary")
  async tenantAgentsSummary() {
    const data = await this.tenantAgents.getSummary();
    return { success: true, data };
  }

  @Get("platform-audit")
  async listPlatformAudit(
    @Query("limit") limit?: string,
    @Query("eventType") eventType?: string,
  ) {
    const items = await this.platformAudit.list({
      limit: limit ? Number(limit) : undefined,
      eventType,
    });
    return { success: true, data: { items } };
  }

  @Get("tenant-lookup")
  async tenantLookup(@Query("slug") slug?: string) {
    if (!slug?.trim()) {
      return { success: false, error: { message: "Missing slug", status: 400 } };
    }

    const tenant = await this.tenants.lookupBySlugAsync(slug);
    if (!tenant) {
      return { success: false, error: { message: "Tenant not found", status: 404 } };
    }

    return { success: true, data: tenant };
  }

  @Get("tenants")
  async listTenants() {
    const items = await this.tenants.listTenants();
    return { success: true, data: { items } };
  }

  @Post("tenants/onboard")
  async onboardTenant(@Body() dto: OnboardTenantDto) {
    const result = await this.tenants.onboardTenant(dto);
    return { success: true, data: result };
  }

  @Patch("tenants/:tenantId/status")
  async updateTenantStatus(
    @Param("tenantId") tenantId: string,
    @Body() body: { status: "active" | "suspended" },
  ) {
    const result = await this.tenants.updateTenantStatus(tenantId, body.status);
    return { success: true, data: result };
  }

  @Patch("tenants/:tenantId/platform-config")
  async patchPlatformConfig(
    @Param("tenantId") tenantId: string,
    @Body()
    body: {
      aiMonthlyBudgetUsd?: number | null;
      markupMultiplier?: number | null;
      lifecycleState?: "trial" | "active" | "suspended" | "offboarding";
      featureFlags?: Record<string, boolean>;
      planLabel?: string;
      notes?: string;
    },
  ) {
    const data = await this.tenants.patchPlatformConfig(tenantId, body);
    return { success: true, data };
  }

  @Post("tenants/:tenantId/support-access")
  async supportAccess(
    @Param("tenantId") tenantId: string,
    @Body() body: { reason: string; platformEmail?: string; platformUserId?: string },
    @Headers("x-platform-user-email") platformEmailHeader?: string,
  ) {
    const data = await this.support.issueSupportAccess({
      tenantId,
      reason: body.reason,
      platformEmail: body.platformEmail ?? platformEmailHeader ?? "platform@aquilens.internal",
      platformUserId: body.platformUserId,
    });
    return { success: true, data };
  }

  @Get("guidance-packs")
  async listGuidancePacks() {
    const items = await this.guidance.listPacksAsync();
    return { success: true, data: { items } };
  }

  @Post("guidance-packs")
  async createGuidancePack(@Body() body: Record<string, unknown>) {
    const pack = this.guidance.createPack(body as Parameters<InternalGuidanceService["createPack"]>[0]);
    return { success: true, data: pack };
  }

  @Get("guidance-packs/families/:familyId/versions")
  async listGuidanceFamilyVersions(@Param("familyId") familyId: string) {
    const items = this.guidance.listFamilyVersions(familyId);
    return { success: true, data: { items } };
  }

  @Get("guidance-packs/:packId")
  async getGuidancePack(@Param("packId") packId: string) {
    const pack = this.guidance.getPack(packId);
    return { success: true, data: pack };
  }

  @Patch("guidance-packs/:packId")
  async updateGuidancePack(
    @Param("packId") packId: string,
    @Body() body: Record<string, unknown>,
  ) {
    if (typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
      const pack = await this.guidance.setPackActive(packId, body.isActive);
      return { success: true, data: pack };
    }
    const pack = this.guidance.updatePack(packId, body as never);
    return { success: true, data: pack };
  }

  @Post("guidance-packs/:packId/new-version")
  async newGuidanceVersion(@Param("packId") packId: string) {
    const pack = this.guidance.createNewVersion(packId);
    return { success: true, data: pack };
  }

  @Post("guidance-packs/:packId/publish")
  async publishGuidancePack(
    @Param("packId") packId: string,
    @Body() body: { changelog: string },
  ) {
    const pack = await this.guidance.publishPack(packId, body.changelog ?? "");
    return { success: true, data: pack };
  }

  @Get("guidance-packs/:packId/adoption")
  async guidanceAdoption(@Param("packId") packId: string) {
    const items = this.guidance.getAdoption(packId);
    return { success: true, data: { items } };
  }

  @Post("guidance-packs/:packId/requirements")
  async addRequirement(
    @Param("packId") packId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const req = this.guidance.addRequirement(packId, body as never);
    return { success: true, data: req };
  }

  @Patch("guidance-packs/:packId/requirements/:reqId")
  async updateRequirement(
    @Param("packId") packId: string,
    @Param("reqId") reqId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const req = this.guidance.updateRequirement(packId, reqId, body as never);
    return { success: true, data: req };
  }

  @Delete("guidance-packs/:packId/requirements/:reqId")
  async deleteRequirement(
    @Param("packId") packId: string,
    @Param("reqId") reqId: string,
  ) {
    const result = this.guidance.deleteRequirement(packId, reqId);
    return { success: true, data: result };
  }
}
