import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { SiaiService } from "./siai.service";

@Controller("api/v1/siai")
@UseGuards(AuthGuard, PermissionGuard)
export class SiaiController {
  constructor(
    @Inject(SiaiService) private readonly siai: SiaiService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission("incidents", "read")
  list(@CurrentUser() user: AuthUser) {
    return { success: true, data: this.siai.list(user) };
  }

  @Get(":id")
  @RequirePermission("incidents", "read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = this.siai.getDetail(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "SIAI record not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Post()
  @RequirePermission("incidents", "create")
  async create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      title: string;
      description: string;
      category: string;
      severity: "critical" | "high" | "medium" | "low";
      linkedProcessId?: string;
    },
  ) {
    const data = await this.siai.create(user, body);
    await this.audit.log(user, {
      eventType: "siai.created",
      entityType: "SIAI",
      entityId: data?.id,
      entityName: data?.title,
      action: `Logged SIAI ${data?.siaiCode}`,
    });
    return { success: true, data };
  }

  @Post(":id/open-resolution")
  @RequirePermission("incidents", "edit")
  async openResolution(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = await this.siai.openResolution(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "SIAI record not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }
}
