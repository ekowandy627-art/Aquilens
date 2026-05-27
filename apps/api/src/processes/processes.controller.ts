import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { randomUUID } from "crypto";
import { AuditService } from "../audit/audit.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";

type ProcessRow = {
  id: string;
  tenant_id: string;
  function_id: string;
  process_area_id: string;
  process_code: string | null;
  name: string;
  description: string | null;
  purpose: string | null;
  status: "draft" | "under_review" | "active" | "retired";
  risk_rating: "high" | "medium" | "low";
  review_frequency: string;
  approval_required: boolean;
  created_at: string;
  updated_at: string;
};

type CreateProcessDto = {
  functionId: string;
  processAreaId: string;
  name: string;
  description?: string;
  purpose?: string;
  approvalRequired?: boolean;
  riskRating?: "high" | "medium" | "low";
  reviewFrequency?: string;
};

type UpdateProcessDto = {
  name?: string;
  description?: string;
  purpose?: string;
  approvalRequired?: boolean;
  riskRating?: "high" | "medium" | "low";
  reviewFrequency?: string;
  status?: "draft" | "under_review" | "active" | "retired";
};

@Controller("api/v1/processes")
@UseGuards(AuthGuard, PermissionGuard)
export class ProcessesController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get()
  @RequirePermission("processes", "read")
  async list(@CurrentUser() user: AuthUser) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from("processes")
      .select(
        "id, tenant_id, function_id, process_area_id, process_code, name, description, purpose, status, risk_rating, review_frequency, approval_required, created_at, updated_at",
      )
      .eq("tenant_id", user.tenantId)
      .order("updated_at", { ascending: false })
      .returns<ProcessRow[]>();

    if (error) {
      return {
        success: false,
        error: { code: "PROCESS_LIST_FAILED", message: error.message, status: 500 },
      };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        id: row.id,
        functionId: row.function_id,
        processAreaId: row.process_area_id,
        processCode: row.process_code ?? undefined,
        name: row.name,
        description: row.description ?? undefined,
        purpose: row.purpose ?? undefined,
        status: row.status,
        riskRating: row.risk_rating,
        reviewFrequency: row.review_frequency,
        approvalRequired: row.approval_required,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    };
  }

  @Post()
  @RequirePermission("processes", "create")
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateProcessDto) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return {
        success: true,
        data: {
          id: randomUUID(),
          name: dto.name,
          status: "draft" as const,
        },
      };
    }

    const processId = randomUUID();
    const versionId = randomUUID();

    const { error: processError } = await supabase.from("processes").insert({
      id: processId,
      tenant_id: user.tenantId,
      function_id: dto.functionId,
      process_area_id: dto.processAreaId,
      name: dto.name,
      description: dto.description,
      purpose: dto.purpose,
      approval_required: dto.approvalRequired ?? false,
      risk_rating: dto.riskRating ?? "medium",
      review_frequency: dto.reviewFrequency ?? "annually",
      status: "draft",
      current_version_id: versionId,
      created_by: user.id,
    });

    if (processError) {
      return {
        success: false,
        error: { code: "PROCESS_CREATE_FAILED", message: processError.message, status: 422 },
      };
    }

    const { error: versionError } = await supabase.from("process_versions").insert({
      id: versionId,
      tenant_id: user.tenantId,
      process_id: processId,
      version_number: 1,
      status: "draft",
      created_by: user.id,
    });

    if (versionError) {
      return {
        success: false,
        error: { code: "PROCESS_VERSION_CREATE_FAILED", message: versionError.message, status: 422 },
      };
    }

    await this.audit.log(user, {
      eventType: "process.created",
      entityType: "Process",
      entityId: processId,
      entityName: dto.name,
      action: `Created process draft "${dto.name}"`,
      afterState: dto,
    });

    await this.audit.log(user, {
      eventType: "process.version_created",
      entityType: "ProcessVersion",
      entityId: versionId,
      entityName: dto.name,
      action: `Created v1 draft for "${dto.name}"`,
      metadata: { processId, versionNumber: 1 },
    });

    return { success: true, data: { id: processId } };
  }

  @Get(":id")
  @RequirePermission("processes", "read")
  async get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: true, data: null };
    }

    const { data, error } = await supabase
      .from("processes")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        error: { code: "PROCESS_GET_FAILED", message: error.message, status: 500 },
      };
    }

    return { success: true, data };
  }

  @Patch(":id")
  @RequirePermission("processes", "edit")
  async update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateProcessDto,
  ) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return { success: true, data: { id } };
    }

    const { data: before } = await supabase
      .from("processes")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", id)
      .maybeSingle();

    const updatePayload: Record<string, unknown> = {};
    if (dto.name !== undefined) updatePayload.name = dto.name;
    if (dto.description !== undefined) updatePayload.description = dto.description;
    if (dto.purpose !== undefined) updatePayload.purpose = dto.purpose;
    if (dto.approvalRequired !== undefined)
      updatePayload.approval_required = dto.approvalRequired;
    if (dto.riskRating !== undefined) updatePayload.risk_rating = dto.riskRating;
    if (dto.reviewFrequency !== undefined)
      updatePayload.review_frequency = dto.reviewFrequency;
    if (dto.status !== undefined) updatePayload.status = dto.status;

    const { error } = await supabase
      .from("processes")
      .update(updatePayload)
      .eq("tenant_id", user.tenantId)
      .eq("id", id);

    if (error) {
      return {
        success: false,
        error: { code: "PROCESS_UPDATE_FAILED", message: error.message, status: 422 },
      };
    }

    const { data: after } = await supabase
      .from("processes")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", id)
      .maybeSingle();

    await this.audit.log(user, {
      eventType: "process.updated",
      entityType: "Process",
      entityId: id,
      entityName: after?.name ?? before?.name,
      action: `Updated process "${after?.name ?? before?.name ?? id}"`,
      beforeState: before ?? undefined,
      afterState: after ?? undefined,
      metadata: { changed: Object.keys(updatePayload) },
    });

    return { success: true, data: { id } };
  }
}

