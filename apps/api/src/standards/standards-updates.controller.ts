import {
  Controller,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { StandardsGapAnalysisService } from "./standards-gap-analysis.service";

@Controller("api/v1/standards")
@UseGuards(AuthGuard, PermissionGuard)
export class StandardsUpdatesController {
  constructor(
    @Inject(StandardsGapAnalysisService)
    private readonly gapAnalysis: StandardsGapAnalysisService,
  ) {}

  @Get("updates")
  @RequirePermission("standards", "read")
  listUpdates(@CurrentUser() user: AuthUser) {
    return {
      success: true,
      data: this.gapAnalysis.listAvailableUpdates(user),
    };
  }

  @Post("updates/:familyId/gap-analysis")
  @RequirePermission("standards", "manage")
  async runGapAnalysis(
    @CurrentUser() user: AuthUser,
    @Param("familyId") familyId: string,
  ) {
    const data = await this.gapAnalysis.runGapAnalysis(user, familyId);
    return { success: true, data };
  }

  @Get("gap-analyses/:id")
  @RequirePermission("standards", "read")
  getGapAnalysis(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = this.gapAnalysis.getGapAnalysis(user, id);
    return { success: true, data };
  }
}
