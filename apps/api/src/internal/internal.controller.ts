import {
  Body,
  Controller,
  Get,
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

@Controller("api/internal")
@UseGuards(InternalGuard)
export class InternalController {
  constructor(
    @Inject(InternalTenantsService)
    private readonly tenants: InternalTenantsService,
    @Inject(InternalGuidanceService)
    private readonly guidance: InternalGuidanceService,
  ) {}

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

  @Get("guidance-packs")
  async listGuidancePacks() {
    const items = await this.guidance.listPacksAsync();
    return { success: true, data: { items } };
  }

  @Patch("guidance-packs/:packId")
  async updateGuidancePack(
    @Param("packId") packId: string,
    @Body() body: { isActive?: boolean },
  ) {
    if (typeof body.isActive !== "boolean") {
      return {
        success: false,
        error: { message: "isActive boolean required", status: 422 },
      };
    }

    const pack = await this.guidance.setPackActive(packId, body.isActive);
    return { success: true, data: pack };
  }
}
