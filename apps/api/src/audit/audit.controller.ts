import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpException,
  Inject,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { AuditService } from "./audit.service";
import { AuditPacksService } from "./audit-packs.service";
import { GuestAccessService } from "./guest-access.service";

type GeneratePackDto = {
  scope: "function" | "process" | "date_range" | "incident";
  scopeId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type CreateGuestAccessDto = {
  scope: "function" | "process" | "date_range" | "incident";
  scopeId?: string;
  expiresAt: string;
  auditorEmail: string;
};

@Controller("api/v1")
@UseGuards(AuthGuard, PermissionGuard)
export class AuditController {
  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AuditPacksService) private readonly auditPacks: AuditPacksService,
    @Inject(GuestAccessService) private readonly guestAccess: GuestAccessService,
  ) {}

  @Get("audit")
  async listAudit(
    @CurrentUser() user: AuthUser,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("actorId") actorId?: string,
    @Query("eventType") eventType?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    this.assertAuditRead(user);
    const data = await this.audit.list(user, {
      entityType,
      entityId,
      actorId,
      eventType,
      dateFrom,
      dateTo,
      cursor,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data };
  }

  @Get("audit/export")
  @Header("Content-Type", "text/csv")
  async exportAudit(
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("actorId") actorId?: string,
    @Query("eventType") eventType?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ) {
    this.assertAuditRead(user);
    const csv = await this.audit.exportCsv(user, {
      entityType,
      entityId,
      actorId,
      eventType,
      dateFrom,
      dateTo,
    });
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="audit-export.csv"',
    );
    res.send(csv);
  }

  @Get("audit-packs")
  @RequirePermission("audit_packs", "generate")
  async listPacks(@CurrentUser() user: AuthUser) {
    const data = await this.auditPacks.list(user);
    return { success: true, data };
  }

  @Post("audit-packs/generate")
  @RequirePermission("audit_packs", "generate")
  async generatePack(@CurrentUser() user: AuthUser, @Body() dto: GeneratePackDto) {
    const data = await this.auditPacks.generate(user, dto);
    return { success: true, data };
  }

  @Get("audit-packs/:jobId/status")
  @RequirePermission("audit_packs", "generate")
  async packStatus(@CurrentUser() user: AuthUser, @Param("jobId") jobId: string) {
    const data = await this.auditPacks.getStatus(user, jobId);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Audit pack job not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Get("audit-packs/:jobId/download")
  @RequirePermission("audit_packs", "generate")
  async packDownload(@CurrentUser() user: AuthUser, @Param("jobId") jobId: string) {
    const data = await this.auditPacks.getDownload(user, jobId);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Audit pack job not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }

  @Get("audit-packs/:jobId/file")
  @RequirePermission("audit_packs", "generate")
  async packFile(
    @CurrentUser() user: AuthUser,
    @Param("jobId") jobId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.auditPacks.ensureReadyPdf(user, jobId);
    if (!buffer) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_READY", message: "Audit pack is not ready.", status: 404 },
        },
        404,
      );
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="audit-pack-${jobId}.pdf"`,
    );
    res.send(buffer);
  }

  @Get("guest-access")
  async listGuestAccess(@CurrentUser() user: AuthUser) {
    this.assertSuperAdmin(user);
    const data = await this.guestAccess.list(user);
    return { success: true, data };
  }

  @Post("guest-access")
  async createGuestAccess(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateGuestAccessDto,
  ) {
    this.assertSuperAdmin(user);
    const data = await this.guestAccess.create(user, dto);
    return { success: true, data };
  }

  @Delete("guest-access/:id")
  async revokeGuestAccess(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    this.assertSuperAdmin(user);
    const data = await this.guestAccess.revoke(user, id);
    if (!data) {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Guest access grant not found.", status: 404 },
        },
        404,
      );
    }
    return { success: true, data };
  }


  private assertSuperAdmin(user: AuthUser) {
    if (!user.permissions.includes("*")) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only Super Admin can manage guest access.",
            status: 403,
          },
        },
        403,
      );
    }
  }

  private assertAuditRead(user: AuthUser) {
    if (
      user.permissions.includes("*") ||
      user.permissions.includes("audit:read") ||
      user.permissions.includes("processes:read")
    ) {
      return;
    }

    throw new HttpException(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permission to view audit trail.",
          status: 403,
        },
      },
      403,
    );
  }
}
