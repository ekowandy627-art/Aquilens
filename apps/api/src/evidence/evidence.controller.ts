import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Inject,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { EvidenceError } from "./evidence.errors";
import { EvidenceService } from "./evidence.service";

type UploadNotesDto = { notes?: string };

@Controller("api/v1")
@UseGuards(AuthGuard, PermissionGuard)
export class EvidenceController {
  constructor(
    @Inject(EvidenceService) private readonly evidence: EvidenceService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Post("workflows/:workflowId/tasks/:taskId/evidence")
  @RequirePermission("workflows", "complete")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @CurrentUser() user: AuthUser,
    @Param("workflowId") workflowId: string,
    @Param("taskId") taskId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadNotesDto,
  ) {
    try {
      if (!file) {
        throw new EvidenceError("INVALID_UPLOAD", "File is required.");
      }

      const data = await this.evidence.upload(user, workflowId, taskId, {
        filename: file.originalname,
        fileType: file.mimetype,
        buffer: file.buffer,
        notes: body.notes,
      });

      await this.audit.log(user, {
        eventType: "evidence.uploaded",
        entityType: "WorkflowTaskEvidence",
        entityId: data.id,
        entityName: data.filename,
        action: `Uploaded evidence "${data.filename}"`,
        metadata: {
          workflowId,
          taskId,
          filename: data.filename,
          fileSize: data.fileSize,
          checksum: data.checksum,
        },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("workflows/:workflowId/tasks/:taskId/evidence")
  @RequirePermission("workflows", "read")
  async list(
    @CurrentUser() user: AuthUser,
    @Param("workflowId") workflowId: string,
    @Param("taskId") taskId: string,
  ) {
    try {
      const data = await this.evidence.listForTask(user, workflowId, taskId);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("evidence/:evidenceId/download")
  @RequirePermission("workflows", "read")
  async download(
    @CurrentUser() user: AuthUser,
    @Param("evidenceId") evidenceId: string,
  ) {
    try {
      const data = await this.evidence.getDownloadUrl(user, evidenceId);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Delete("evidence/:evidenceId")
  @RequirePermission("workflows", "complete")
  deleteNotAllowed() {
    throw new HttpException(
      {
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Evidence cannot be deleted after upload.",
          status: 405,
        },
      },
      405,
    );
  }

  private mapError(error: unknown): never {
    if (error instanceof EvidenceError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "METHOD_NOT_ALLOWED"
              ? 405
              : 422;
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status },
        },
        status,
      );
    }

    const message = error instanceof Error ? error.message : "Request failed";
    throw new HttpException(
      {
        success: false,
        error: { code: "EVIDENCE_REQUEST_FAILED", message, status: 422 },
      },
      422,
    );
  }
}
