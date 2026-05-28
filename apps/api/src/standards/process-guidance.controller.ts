import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { StandardsService } from "./standards.service";

@Controller("api/v1/processes")
@UseGuards(AuthGuard, PermissionGuard)
export class ProcessGuidanceController {
  constructor(
    @Inject(StandardsService) private readonly standards: StandardsService,
  ) {}

  @Get(":id/guidance")
  @RequirePermission("standards", "read")
  listProcessGuidance(
    @CurrentUser() user: AuthUser,
    @Param("id") processId: string,
  ) {
    return {
      success: true,
      data: this.standards.listProcessGuidance(user, processId),
    };
  }

  @Put(":id/guidance")
  @RequirePermission("processes", "edit")
  replaceProcessGuidance(
    @CurrentUser() user: AuthUser,
    @Param("id") processId: string,
    @Body()
    body: {
      links: Array<{ packId: string; requirementId?: string }>;
    },
  ) {
    return {
      success: true,
      data: this.standards.replaceProcessGuidance(
        user,
        processId,
        body.links ?? [],
      ),
    };
  }
}
