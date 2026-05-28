import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import type { GuidanceSelectionStatus } from "@aquilens/shared";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { StandardsService } from "./standards.service";

@Controller("api/v1/guidance")
@UseGuards(AuthGuard, PermissionGuard)
export class GuidanceController {
  constructor(
    @Inject(StandardsService) private readonly standards: StandardsService,
  ) {}

  @Get("packs")
  @RequirePermission("standards", "read")
  listPacks(
    @CurrentUser() user: AuthUser,
    @Query("sector") sector?: string,
    @Query("jurisdiction") jurisdiction?: string,
  ) {
    return {
      success: true,
      data: this.standards.listPacks(user, { sector, jurisdiction }),
    };
  }

  @Get("packs/:slug")
  @RequirePermission("standards", "read")
  getPack(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    const pack = this.standards.getPackBySlug(user, slug);
    if (!pack) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Guidance pack not found.",
          status: 404,
        },
      });
    }
    return { success: true, data: pack };
  }

  @Get("recommendations")
  @RequirePermission("standards", "read")
  recommendations(
    @CurrentUser() user: AuthUser,
    @Query("organisationType") organisationType?: string,
    @Query("country") country?: string,
    @Query("certificationTargets") certificationTargets?: string,
  ) {
    return {
      success: true,
      data: this.standards.getRecommendations(user, {
        organisationType,
        country,
        certificationTargets,
      }),
    };
  }
}

@Controller("api/v1/tenants/me")
@UseGuards(AuthGuard, PermissionGuard)
export class TenantGuidanceController {
  constructor(
    @Inject(StandardsService) private readonly standards: StandardsService,
  ) {}

  @Get("guidance-selections")
  @RequirePermission("standards", "read")
  listSelections(@CurrentUser() user: AuthUser) {
    return { success: true, data: this.standards.listSelections(user) };
  }

  @Put("guidance-selections")
  @RequirePermission("standards", "manage")
  async upsertSelections(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      selections: Array<{
        packId: string;
        selectionStatus: GuidanceSelectionStatus;
      }>;
    },
  ) {
    const data = await this.standards.upsertSelections(
      user,
      body.selections ?? [],
    );
    return { success: true, data };
  }

  @Put("organisation-profile")
  @RequirePermission("standards", "manage")
  updateOrganisationProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    const data = this.standards.updateOrganisationProfile(user, {
      organisationType:
        typeof body.organisationType === "string"
          ? body.organisationType
          : undefined,
      countries: Array.isArray(body.countries)
        ? body.countries.filter((value): value is string => typeof value === "string")
        : undefined,
      multiSite: typeof body.multiSite === "boolean" ? body.multiSite : undefined,
      staffBand:
        typeof body.staffBand === "string" ? body.staffBand : undefined,
      goals: Array.isArray(body.goals)
        ? body.goals.filter((value): value is string => typeof value === "string")
        : undefined,
      regulators: Array.isArray(body.regulators)
        ? body.regulators.filter((value): value is string => typeof value === "string")
        : undefined,
      certificationTargets: Array.isArray(body.certificationTargets)
        ? body.certificationTargets.filter(
            (value): value is string => typeof value === "string",
          )
        : undefined,
    });
    return { success: true, data };
  }

  @Get("organisation-profile")
  @RequirePermission("standards", "read")
  getOrganisationProfile(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      data: this.standards.getOrganisationProfile(user),
    };
  }
}

@Controller("api/v1/functions")
@UseGuards(AuthGuard, PermissionGuard)
export class FunctionGuidanceController {
  constructor(
    @Inject(StandardsService) private readonly standards: StandardsService,
  ) {}

  @Get(":id/guidance")
  @RequirePermission("standards", "read")
  listFunctionGuidance(
    @CurrentUser() user: AuthUser,
    @Param("id") functionId: string,
  ) {
    return {
      success: true,
      data: this.standards.listFunctionGuidance(user, functionId),
    };
  }

  @Put(":id/guidance")
  @RequirePermission("tenant_scaffold", "manage")
  replaceFunctionGuidance(
    @CurrentUser() user: AuthUser,
    @Param("id") functionId: string,
    @Body() body: { packIds: string[] },
  ) {
    return {
      success: true,
      data: this.standards.replaceFunctionGuidance(
        user,
        functionId,
        body.packIds ?? [],
      ),
    };
  }
}
