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
  Put,
  Query,
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
import { ProcessesService } from "./processes.service";
import type { ExecutionSchedule } from "./execution-schedule";
import type { ProcessPersonRole } from "./execution-schedule";
import { ProcessLifecycleError } from "../approvals/process-lifecycle";
import { ProcessAccessError } from "./process-access";

type CreateProcessDto = {
  functionId: string;
  processAreaId: string;
  name: string;
  description?: string;
  purpose?: string;
  whoItAffects?: string[];
  linkedSystems?: string[];
  linkedPolicies?: string;
  tags?: string[];
  riskRating?: "high" | "medium" | "low";
  riskNotes?: string;
  governanceControls?: unknown[];
  approvalRequired?: boolean;
  reviewFrequency?: string;
  executionSchedule?: ExecutionSchedule;
  regulatoryReference?: string;
  creationSource?: "manual" | "ai_generated";
};

type UpdateProcessDto = Partial<CreateProcessDto> & {
  status?: "draft" | "under_review" | "active" | "retired" | "archived";
  triggerDescription?: string;
  participants?: Array<{ role: string; userId?: string }>;
  inputs?: string;
  outputs?: string;
  exceptions?: string;
  relatedDocuments?: unknown[];
  acknowledgementRequired?: boolean;
  operatingJurisdictions?: string[];
  outputMarketJurisdictions?: string[];
  jurisdictionsInheritOrg?: boolean;
};

type PublishProcessDto = {
  effectiveDate: string;
  reviewDueDate?: string;
  acknowledgementRequired?: boolean;
  acknowledgementDueDate?: string;
};

type StepDto = {
  stepNumber?: number;
  title: string;
  description?: string;
  responsibleRole?: string;
  stepType?: "manual" | "approval" | "system";
  inputs?: string;
  outputs?: string;
  controls?: string;
  notes?: string;
  evidenceRequired?: boolean;
  isControlPoint?: boolean;
  evidenceMap?: Record<string, unknown>;
};

type ReorderDto = {
  orderedIds: string[];
};

type PeopleDto = {
  people: Array<{ userId?: string; role: ProcessPersonRole }>;
};

@Controller("api/v1/processes")
@UseGuards(AuthGuard, PermissionGuard)
export class ProcessesController {
  constructor(
    @Inject(ProcessesService) private readonly processes: ProcessesService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission("processes", "read")
  async list(
    @CurrentUser() user: AuthUser,
    @Query("status") status?: string,
    @Query("riskRating") riskRating?: string,
    @Query("functionId") functionId?: string,
    @Query("tag") tag?: string,
  ) {
    try {
      const data = await this.processes.list(user, {
        status,
        riskRating,
        functionId,
        tag,
      });
      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_LIST_FAILED", error, 500);
    }
  }

  @Post()
  @RequirePermission("processes", "create")
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProcessDto) {
    try {
      const data = await this.processes.create(user, dto);

      await this.audit.log(user, {
        eventType: "process.created",
        entityType: "Process",
        entityId: data.id,
        entityName: dto.name,
        action: `Created process draft "${dto.name}"`,
        afterState: dto,
      });

      await this.audit.log(user, {
        eventType: "process.version_created",
        entityType: "ProcessVersion",
        entityId: data.id,
        entityName: dto.name,
        action: `Created v1 draft for "${dto.name}"`,
        metadata: { processId: data.id, versionNumber: 1 },
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_CREATE_FAILED", error, 422);
    }
  }

  @Get(":id/access")
  @RequirePermission("processes", "read")
  async access(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.processes.getAccess(user, id);
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

  @Get(":id")
  @RequirePermission("processes", "read")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.processes.getDetail(user, id);
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

  @Patch(":id")
  @RequirePermission("processes", "edit")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateProcessDto,
  ) {
    try {
      const before = await this.processes.getDetail(user, id);
      const data = await this.processes.update(user, id, dto);

      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        };
      }

      const after = await this.processes.getDetail(user, id);

      await this.audit.log(user, {
        eventType: "process.updated",
        entityType: "Process",
        entityId: id,
        entityName: after?.name ?? before?.name,
        action: `Updated process "${after?.name ?? id}"`,
        beforeState: before ?? undefined,
        afterState: after ?? undefined,
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_UPDATE_FAILED", error, 422);
    }
  }

  @Post(":id/publish")
  @RequirePermission("processes", "publish")
  async publish(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: PublishProcessDto,
  ) {
    try {
      const data = await this.processes.publish(user, id, dto);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        };
      }

      await this.audit.log(user, {
        eventType: "sop.published",
        entityType: "Process",
        entityId: id,
        action: `Published SOP ${id}`,
        metadata: {
          effectiveDate: dto.effectiveDate,
          reviewDueDate: dto.reviewDueDate,
        },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/archive")
  @RequirePermission("processes", "edit")
  async archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.processes.archive(user, id);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        };
      }

      await this.audit.log(user, {
        eventType: "process.archived",
        entityType: "Process",
        entityId: id,
        action: `Archived process ${id}`,
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Get(":id/documents")
  @RequirePermission("processes", "read")
  async listDocuments(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.processes.listDocuments(user, id);
      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Post(":id/documents")
  @RequirePermission("processes", "edit")
  @UseInterceptors(FileInterceptor("file"))
  async uploadDocument(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @UploadedFile()
    file:
      | { originalname: string; mimetype: string; size: number; buffer: Buffer }
      | undefined,
  ) {
    if (!file) {
      return {
        success: false,
        error: { code: "FILE_REQUIRED", message: "File is required.", status: 422 },
      };
    }

    try {
      const data = await this.processes.addDocument(user, id, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      });

      await this.audit.log(user, {
        eventType: "process.document_uploaded",
        entityType: "ProcessDocument",
        entityId: data.id,
        entityName: data.filename,
        action: `Uploaded document "${data.filename}"`,
        metadata: { processId: id },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  @Delete(":id")
  @RequirePermission("processes", "edit")
  async retire(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    try {
      const data = await this.processes.retire(user, id);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        };
      }

      await this.audit.log(user, {
        eventType: "process.retired",
        entityType: "Process",
        entityId: id,
        action: `Retired process ${id}`,
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_RETIRE_FAILED", error, 422);
    }
  }

  @Post(":id/versions/:versionId/steps")
  @RequirePermission("processes", "edit")
  async addStep(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Body() dto: StepDto,
  ) {
    try {
      const steps = await this.processes.getDetail(user, id);
      const stepNumber = dto.stepNumber ?? (steps?.steps.length ?? 0) + 1;
      const data = await this.processes.addStep(user, id, versionId, {
        ...dto,
        stepNumber,
      });

      await this.audit.log(user, {
        eventType: "process.step_added",
        entityType: "ProcessStep",
        entityId: data.id,
        entityName: dto.title,
        action: `Added step "${dto.title}"`,
        metadata: { processId: id, versionId },
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_STEP_CREATE_FAILED", error, 422);
    }
  }

  @Patch(":id/versions/:versionId/steps/:stepId")
  @RequirePermission("processes", "edit")
  async updateStep(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Param("stepId") stepId: string,
    @Body() dto: StepDto,
  ) {
    try {
      const data = await this.processes.updateStep(user, id, versionId, stepId, dto);
      if (!data) {
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Step not found.", status: 404 },
        };
      }

      await this.audit.log(user, {
        eventType: "process.step_updated",
        entityType: "ProcessStep",
        entityId: stepId,
        entityName: dto.title,
        action: `Updated step "${dto.title ?? stepId}"`,
        metadata: { processId: id, versionId },
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_STEP_UPDATE_FAILED", error, 422);
    }
  }

  @Delete(":id/versions/:versionId/steps/:stepId")
  @RequirePermission("processes", "edit")
  async deleteStep(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Param("stepId") stepId: string,
  ) {
    try {
      const data = await this.processes.deleteStep(user, id, versionId, stepId);

      await this.audit.log(user, {
        eventType: "process.step_deleted",
        entityType: "ProcessStep",
        entityId: stepId,
        action: `Deleted step ${stepId}`,
        metadata: { processId: id, versionId },
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_STEP_DELETE_FAILED", error, 422);
    }
  }

  @Post(":id/versions/:versionId/steps/reorder")
  @RequirePermission("processes", "edit")
  async reorderSteps(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Body() dto: ReorderDto,
  ) {
    try {
      const data = await this.processes.reorderSteps(
        user,
        id,
        versionId,
        dto.orderedIds,
      );

      await this.audit.log(user, {
        eventType: "process.steps_reordered",
        entityType: "ProcessVersion",
        entityId: versionId,
        action: "Reordered process steps",
        metadata: { processId: id, orderedIds: dto.orderedIds },
      });

      return { success: true, data };
    } catch (error) {
      return this.error("PROCESS_STEP_REORDER_FAILED", error, 422);
    }
  }

  @Put(":id/versions/:versionId/people")
  @RequirePermission("processes", "edit")
  async replacePeople(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("versionId") versionId: string,
    @Body() dto: PeopleDto,
  ) {
    try {
      const data = await this.processes.replacePeople(
        user,
        id,
        versionId,
        dto.people,
      );

      await this.audit.log(user, {
        eventType: "process.people_updated",
        entityType: "ProcessVersion",
        entityId: versionId,
        action: "Updated process people assignments",
        metadata: { processId: id, count: dto.people.length },
      });

      return { success: true, data };
    } catch (error) {
      return this.mapError(error);
    }
  }

  private mapError(error: unknown): never {
    if (error instanceof ProcessLifecycleError) {
      const status =
        error.code === "NOT_FOUND"
          ? 404
          : error.code === "FILE_TOO_LARGE"
            ? 413
            : 422;
      throw new HttpException(
        {
          success: false,
          error: { code: error.code, message: error.message, status },
        },
        status,
      );
    }

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

    if (error instanceof Error && error.message === "Process not found") {
      throw new HttpException(
        {
          success: false,
          error: { code: "NOT_FOUND", message: error.message, status: 404 },
        },
        404,
      );
    }

    const message = error instanceof Error ? error.message : "Request failed";
    throw new HttpException(
      {
        success: false,
        error: { code: "PROCESS_REQUEST_FAILED", message, status: 422 },
      },
      422,
    );
  }

  private error(code: string, error: unknown, status: number) {
    if (error instanceof ProcessAccessError) {
      return this.mapError(error);
    }

    const message = error instanceof Error ? error.message : "Request failed";
    return {
      success: false,
      error: { code, message, status },
    };
  }
}
