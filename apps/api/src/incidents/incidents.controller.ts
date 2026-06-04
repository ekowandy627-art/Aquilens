import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { IncidentError, IncidentsService } from "./incidents.service";

@Controller("api/v1/incidents")
@UseGuards(AuthGuard, PermissionGuard)
export class IncidentsController {
  constructor(
    @Inject(IncidentsService) private readonly incidents: IncidentsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission("incidents", "read")
  list(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: string,
  ) {
    return {
      success: true,
      data: this.incidents.list(user, { status }),
    };
  }

  @Get(":id")
  @RequirePermission("incidents", "read")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const data = this.incidents.getDetail(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Incident not found.", status: 404 },
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
      incidentType: string;
      severity: "critical" | "high" | "medium" | "low";
      linkedProcessId?: string;
      correctiveAction?: string;
    },
  ) {
    try {
      const data = await this.incidents.create(user, body);
      await this.audit.log(user, {
        eventType: "incident.logged",
        entityType: "Incident",
        entityId: data?.id,
        entityName: data?.title,
        action: `Logged incident ${data?.incidentCode}`,
      });
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/actions")
  @RequirePermission("incidents", "edit")
  addAction(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body()
    body: {
      actionType: "corrective" | "preventive";
      description: string;
      assignedTo?: string;
      referenceUrls?: string[];
    },
  ) {
    const data = this.incidents.addAction(user, id, body);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Incident not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Post(":id/actions/:actionId/complete")
  @RequirePermission("incidents", "edit")
  completeAction(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("actionId") actionId: string,
    @Body()
    body: { notes?: string; referenceUrls?: string[]; evidenceFileIds?: string[] },
  ) {
    const data = this.incidents.completeAction(user, id, actionId, body);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Action not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Post(":id/open-resolution")
  @RequirePermission("incidents", "edit")
  async openResolution(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.incidents.openResolution(user, id);
      if (!data) {
        throw new HttpException(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Incident not found.", status: 404 },
          },
          404,
        );
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private mapError(error: unknown) {
    if (error instanceof IncidentError) {
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status: 422 },
        },
        422,
      );
    }
    throw error;
  }
}
