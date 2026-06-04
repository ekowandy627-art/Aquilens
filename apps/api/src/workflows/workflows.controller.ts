import {
  Body,
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Patch,
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
import { EvidenceError } from "../evidence/evidence.errors";
import {
  WorkflowsService,
  WorkflowExecutionError,
} from "./workflows.service";

type StartWorkflowDto = {
  processId: string;
  title: string;
  context?: string;
  assignees?: Array<{ stepId: string; userId: string }>;
};

type UpdateWorkflowDto = {
  title?: string;
  context?: string;
};

type CancelWorkflowDto = {
  reason: string;
};

type CompleteTaskDto = {
  notes?: string;
};

type SkipTaskDto = {
  reason: string;
};

type RejectTaskDto = {
  comment: string;
};

@Controller("api/v1/workflows")
@UseGuards(AuthGuard, PermissionGuard)
export class WorkflowsController {
  constructor(
    @Inject(WorkflowsService) private readonly workflows: WorkflowsService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Post()
  @RequirePermission("processes", "edit")
  async start(@CurrentUser() user: AuthUser, @Body() dto: StartWorkflowDto) {
    try {
      await this.workflows.start(user, dto);
      return { success: true };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get()
  @RequirePermission("workflows", "read")
  async list(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: string,
    @Query("processId") processId?: string,
    @Query("startedBy") startedBy?: string,
  ) {
    try {
      const data = await this.workflows.list(user, { status, processId, startedBy });
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get("my-tasks")
  @RequirePermission("workflows", "read")
  async myTasks(@CurrentUser() user: AuthUser) {
    try {
      const data = await this.workflows.listMyTasks(user);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get(":id")
  @RequirePermission("workflows", "read")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.workflows.get(user, id);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow not found.", status: 404 },
        };
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Patch(":id")
  @RequirePermission("processes", "edit")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    try {
      const data = await this.workflows.updateMetadata(user, id, dto);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Workflow not found.", status: 404 },
        };
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/cancel")
  @RequirePermission("processes", "edit")
  async cancel(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: CancelWorkflowDto,
  ) {
    try {
      const data = await this.workflows.cancel(user, id, dto.reason);

      await this.auditService.log(user, {
        eventType: "workflow.cancelled",
        entityType: "WorkflowInstance",
        entityId: id,
        action: "Cancelled workflow",
        metadata: { reason: dto.reason },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get(":id/tasks")
  @RequirePermission("workflows", "read")
  async listTasks(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.workflows.listTasks(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get(":id/tasks/:taskId")
  @RequirePermission("workflows", "read")
  async getTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
  ) {
    try {
      const data = await this.workflows.getTask(user, id, taskId);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Task not found.", status: 404 },
        };
      }
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/tasks/:taskId/start")
  @RequirePermission("workflows", "complete")
  async startTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
  ) {
    try {
      const data = await this.workflows.startTask(user, id, taskId);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/tasks/:taskId/complete")
  @RequirePermission("workflows", "complete")
  async completeTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() dto: CompleteTaskDto,
  ) {
    try {
      const data = await this.workflows.completeTask(user, id, taskId, dto.notes);

      await this.auditService.log(user, {
        eventType: "workflow_task.completed",
        entityType: "WorkflowInstance",
        entityId: id,
        action: `Completed task ${taskId}`,
        metadata: { taskId, notes: dto.notes },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/tasks/:taskId/skip")
  @RequirePermission("workflows", "complete")
  async skipTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() dto: SkipTaskDto,
  ) {
    try {
      const data = await this.workflows.skipTask(user, id, taskId, dto.reason);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/tasks/:taskId/approve")
  @RequirePermission("processes", "approve")
  async approveTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() dto: CompleteTaskDto,
  ) {
    try {
      const data = await this.workflows.approveTask(user, id, taskId, dto.notes);

      await this.auditService.log(user, {
        eventType: "workflow_task.approved",
        entityType: "WorkflowInstance",
        entityId: id,
        action: `Approved task ${taskId}`,
        metadata: { taskId, notes: dto.notes },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/tasks/:taskId/reject")
  @RequirePermission("processes", "approve")
  async rejectTask(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() dto: RejectTaskDto,
  ) {
    try {
      const data = await this.workflows.rejectTask(user, id, taskId, dto.comment);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get(":id/audit")
  @RequirePermission("workflows", "read")
  async listWorkflowAudit(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.workflows.listAudit(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private mapError(error: unknown): never {
    if (error instanceof WorkflowExecutionError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FORBIDDEN"
            ? 403
            : error.code === "SEQUENCE_VIOLATION"
              ? 409
              : error.code === "PROCESS_NOT_ACTIVE"
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

    if (error instanceof EvidenceError) {
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status: 422 },
        },
        422,
      );
    }

    const message = error instanceof Error ? error.message : "Request failed";
    throw new HttpException(
      {
        success: false,
        error: { code: "WORKFLOW_REQUEST_FAILED", message, status: 422 },
      },
      422,
    );
  }
}
