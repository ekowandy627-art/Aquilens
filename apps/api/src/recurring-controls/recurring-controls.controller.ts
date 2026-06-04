import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { RecurringControlsService } from "./recurring-controls.service";
import type { VerificationStatus } from "./recurring-controls-demo.store";

@Controller("api/v1/recurring-controls")
@UseGuards(AuthGuard, PermissionGuard)
export class RecurringControlsController {
  constructor(
    @Inject(RecurringControlsService) private readonly recurring: RecurringControlsService,
  ) {}

  @Get()
  @RequirePermission("processes", "read")
  list(@CurrentUser() user: AuthUser) {
    return { success: true, data: this.recurring.list(user) };
  }

  @Post()
  @RequirePermission("processes", "edit")
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      title: string;
      recordLocation: string;
      ownerId: string;
      frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
      controlPointStepId?: string;
      processId?: string;
    },
  ) {
    const data = this.recurring.create(user, body);
    return { success: true, data };
  }

  @Patch(":id/verification")
  @RequirePermission("processes", "edit")
  verify(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: { status: VerificationStatus },
  ) {
    const data = this.recurring.verify(user, id, body.status);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Record not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }
}
