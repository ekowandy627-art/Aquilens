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
import { ProcessAccessError } from "../processes/process-access";
import {
  ApprovalsService,
  ProcessLifecycleError,
} from "./approvals.service";

type CommentDto = { comment?: string };
type RejectDto = { comment: string };

@Controller("api/v1")
@UseGuards(AuthGuard, PermissionGuard)
export class ApprovalsController {
  constructor(
    @Inject(ApprovalsService) private readonly approvals: ApprovalsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get("approvals")
  @RequirePermission("processes", "approve")
  async list(@CurrentUser() user: AuthUser) {
    try {
      const data = await this.approvals.listPending(user);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("approvals/count")
  @RequirePermission("processes", "approve")
  async count(@CurrentUser() user: AuthUser) {
    try {
      const data = await this.approvals.pendingCount(user);
      return { success: true, data: { count: data } };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("approvals/:id")
  @RequirePermission("processes", "approve")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.approvals.getApproval(user, id);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Approval not found.", status: 404 },
        };
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("approvals/:id/approve")
  @RequirePermission("processes", "approve")
  async approveById(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: CommentDto,
  ) {
    try {
      const approval = await this.approvals.getApproval(user, id);
      if (!approval) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Approval not found.", status: 404 },
        };
      }
      const data = await this.approvals.approve(
        user,
        approval.processId,
        dto.comment,
        id,
      );

      await this.audit.log(user, {
        eventType: "process.approved",
        entityType: "Process",
        entityId: approval.processId,
        entityName: approval.processName,
        action: `Approved SOP "${approval.processName}"`,
        metadata: { approvalId: id, comment: dto.comment },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("approvals/:id/reject")
  @RequirePermission("processes", "approve")
  async rejectById(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: RejectDto,
  ) {
    try {
      const approval = await this.approvals.getApproval(user, id);
      if (!approval) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Approval not found.", status: 404 },
        };
      }
      const data = await this.approvals.reject(
        user,
        approval.processId,
        dto.comment,
        id,
      );

      await this.audit.log(user, {
        eventType: "process.rejected",
        entityType: "Process",
        entityId: approval.processId,
        entityName: approval.processName,
        action: `Rejected SOP "${approval.processName}"`,
        metadata: { approvalId: id, comment: dto.comment },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("processes/:id/submit")
  @RequirePermission("processes", "edit")
  async submit(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.approvals.submit(user, id);

      await this.audit.log(user, {
        eventType: "process.submitted",
        entityType: "Process",
        entityId: id,
        action: "Submitted process for approval",
        metadata: { approvalId: data.approvalId },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("processes/:id/approve")
  @RequirePermission("processes", "approve")
  async approveProcess(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: CommentDto,
  ) {
    try {
      const data = await this.approvals.approve(user, id, dto.comment);

      await this.audit.log(user, {
        eventType: "process.approved",
        entityType: "Process",
        entityId: id,
        action: "Approved process",
        metadata: { comment: dto.comment },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("processes/:id/reject")
  @RequirePermission("processes", "approve")
  async rejectProcess(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: RejectDto,
  ) {
    try {
      const data = await this.approvals.reject(user, id, dto.comment);

      await this.audit.log(user, {
        eventType: "process.rejected",
        entityType: "Process",
        entityId: id,
        action: "Rejected process",
        metadata: { comment: dto.comment },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post("processes/:id/versions")
  @RequirePermission("processes", "edit")
  async createVersion(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.approvals.createVersion(user, id);

      await this.audit.log(user, {
        eventType: "process.version_created",
        entityType: "ProcessVersion",
        entityId: data.versionId,
        action: `Created draft v${data.versionNumber}`,
        metadata: { processId: id },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("processes/:id/versions")
  @RequirePermission("processes", "read")
  async listVersions(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.approvals.listVersions(user, id);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        };
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("processes/:id/approvals")
  @RequirePermission("processes", "read")
  async processApprovals(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    try {
      const data = await this.approvals.listProcessApprovals(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private mapError(error: unknown): never {
    if (error instanceof ProcessAccessError) {
      const status = error.code === "NOT_FOUND" ? 404 : 403;
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status },
        },
        status,
      );
    }

    if (error instanceof ProcessLifecycleError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "COMMENT_REQUIRED"
            ? 422
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
        error: { code: "APPROVAL_REQUEST_FAILED", message, status: 422 },
      },
      422,
    );
  }
}
