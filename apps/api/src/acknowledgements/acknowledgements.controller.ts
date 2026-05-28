import {
  Body,
  Controller,
  Get,
  Headers,
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
import { AcknowledgementsService } from "./acknowledgements.service";

type CreateCampaignDto = {
  userIds: string[];
  dueDate?: string;
};

type ConfirmAcknowledgementDto = {
  processVersionId?: string;
};

@Controller("api/v1")
@UseGuards(AuthGuard, PermissionGuard)
export class AcknowledgementsController {
  constructor(
    @Inject(AcknowledgementsService)
    private readonly acknowledgements: AcknowledgementsService,
  ) {}

  @Get("acknowledgements/my")
  @RequirePermission("acknowledgements", "complete")
  async listMy(@CurrentUser() user: AuthUser) {
    const data = await this.acknowledgements.listMyPending(user);
    return { success: true, data };
  }

  @Get("acknowledgements/assignments/:assignmentId/sop")
  @RequirePermission("acknowledgements", "complete")
  async readAssignmentSop(
    @CurrentUser() user: AuthUser,
    @Param("assignmentId") assignmentId: string,
  ) {
    const data = await this.acknowledgements.getAssignmentSop(user, assignmentId);
    return { success: true, data };
  }

  @Post("acknowledgements/:assignmentId/confirm")
  @RequirePermission("acknowledgements", "complete")
  async confirm(
    @CurrentUser() user: AuthUser,
    @Param("assignmentId") assignmentId: string,
    @Headers("user-agent") userAgent?: string,
    @Body() body: ConfirmAcknowledgementDto = {},
  ) {
    const data = await this.acknowledgements.confirm(user, assignmentId, {
      userAgent,
      processVersionId: body.processVersionId,
    });
    return { success: true, data };
  }

  @Get("processes/:processId/acknowledgements")
  @RequirePermission("acknowledgements", "read")
  async listForProcess(
    @CurrentUser() user: AuthUser,
    @Param("processId") processId: string,
  ) {
    const data = await this.acknowledgements.getProcessAcknowledgements(
      user,
      processId,
    );
    return { success: true, data };
  }

  @Post("processes/:processId/acknowledgements/campaigns")
  @RequirePermission("acknowledgements", "manage")
  async createCampaign(
    @CurrentUser() user: AuthUser,
    @Param("processId") processId: string,
    @Body() body: CreateCampaignDto,
  ) {
    const data = await this.acknowledgements.createCampaign(user, processId, body);
    return { success: true, data };
  }

  @Get("acknowledgements/overdue")
  @RequirePermission("acknowledgements", "read")
  async listOverdue(@CurrentUser() user: AuthUser) {
    const data = await this.acknowledgements.listOverdue(user);
    return { success: true, data };
  }
}
