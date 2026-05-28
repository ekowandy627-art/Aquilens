import {
  Body,
  Controller,
  Delete,
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
import { EscalationService } from "./escalation.service";
import type { EscalationLevelInput } from "./notification.types";

type CreateEscalationRuleDto = {
  name: string;
  triggerEvent: string;
  levels: EscalationLevelInput[];
};

type UpdateEscalationRuleDto = {
  name?: string;
  triggerEvent?: string;
  levels?: EscalationLevelInput[];
};

@Controller("api/v1/escalation-rules")
@UseGuards(AuthGuard, PermissionGuard)
export class EscalationController {
  constructor(
    @Inject(EscalationService) private readonly escalation: EscalationService,
  ) {}

  @Get()
  @RequirePermission("settings", "manage")
  async list(@CurrentUser() user: AuthUser) {
    const data = await this.escalation.list(user);
    return { success: true, data };
  }

  @Post()
  @RequirePermission("settings", "manage")
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateEscalationRuleDto) {
    if (!dto.name?.trim() || !dto.triggerEvent?.trim() || !dto.levels?.length) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Name, trigger event, and at least one level are required.",
            status: 422,
          },
        },
        422,
      );
    }

    const data = await this.escalation.create(user, {
      name: dto.name.trim(),
      triggerEvent: dto.triggerEvent.trim(),
      levels: dto.levels,
    });
    return { success: true, data };
  }

  @Get(":id")
  @RequirePermission("settings", "manage")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = await this.escalation.get(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Escalation rule not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Patch(":id")
  @RequirePermission("settings", "manage")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateEscalationRuleDto,
  ) {
    const data = await this.escalation.update(user, id, dto);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Escalation rule not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Delete(":id")
  @RequirePermission("settings", "manage")
  async remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const deleted = await this.escalation.delete(user, id);
    if (!deleted) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Escalation rule not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data: { id } };
  }

  @Post(":id/toggle")
  @RequirePermission("settings", "manage")
  async toggle(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = await this.escalation.toggle(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Escalation rule not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }
}
