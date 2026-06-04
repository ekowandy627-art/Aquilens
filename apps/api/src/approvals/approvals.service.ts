import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import {
  assertScopedPermission,
  hasPermissionGrant,
} from "../auth/permission-scopes";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getSupabaseForUser } from "../demo/demo-data-mode";
import { approvalDemoStore } from "./approval-demo.store";
import {
  assertCanApprove,
  assertCanCreateVersion,
  assertCanReject,
  assertCanSubmit,
  ProcessLifecycleError,
} from "./process-lifecycle";
import { processDemoStore } from "../processes/process-demo.store";
import {
  assertProcessEdit,
  ProcessAccessError,
  resolveProcessAccess,
} from "../processes/process-access";
import { WorkflowEngineService } from "../workflows/workflow-engine.service";

export { ProcessLifecycleError };

@Injectable()
export class ApprovalsService {
  constructor(
    @Inject(WorkflowEngineService)
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  async listPending(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const items = approvalDemoStore.listForApprover(
        user.tenantId,
        user.id,
        "pending",
      );
      return Promise.all(items.map((item) => this.enrichApproval(item)));
    }

    const { data, error } = await supabase
      .from("approval_instances")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("approver_id", user.id)
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return Promise.all((data ?? []).map((row) => this.enrichApprovalFromRow(row)));
  }

  async getApproval(user: AuthUser, approvalId: string) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const item = approvalDemoStore.get(approvalId);
      if (!item || item.tenantId !== user.tenantId) {
        return null;
      }
      if (item.approverId !== user.id && !user.permissions.includes("*")) {
        throw new ProcessAccessError("FORBIDDEN", "Not your approval.");
      }
      return this.enrichApproval(item);
    }

    const { data, error } = await supabase
      .from("approval_instances")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("id", approvalId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }
    if (
      data.approver_id !== user.id &&
      !user.permissions.includes("*") &&
      !hasPermissionGrant(user, "processes", "approve")
    ) {
      throw new ProcessAccessError("FORBIDDEN", "Not your approval.");
    }

    return this.enrichApprovalFromRow(data);
  }

  async pendingCount(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return approvalDemoStore.pendingCountForApprover(user.tenantId, user.id);
    }

    const { count, error } = await supabase
      .from("approval_instances")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.tenantId)
      .eq("approver_id", user.id)
      .eq("status", "pending");

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  }

  async listProcessApprovals(user: AuthUser, processId: string) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return approvalDemoStore
        .listForProcess(processId)
        .map((item) => this.toApprovalSummary(item));
    }

    const { data, error } = await supabase
      .from("approval_instances")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("process_id", processId)
      .order("submitted_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.toApprovalSummaryFromRow(row));
  }

  async submit(user: AuthUser, processId: string) {
    const context = await this.loadProcessContext(user, processId);
    assertProcessEdit(context.access);
    assertCanSubmit(context.processStatus, context.versionStatus);

    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const result = processDemoStore.submitForApproval(
        user.tenantId,
        processId,
        user.id,
      );
      if (!result) {
        throw new ProcessLifecycleError("NOT_FOUND", "Process not found.");
      }
      await this.workflowEngine.trigger(user, "sop_submitted_for_approval", {
        processId,
        approvalId: result.approval.id,
        approverId: result.approval.approverId,
      });
      return { processId, approvalId: result.approval.id, status: "under_review" };
    }

    const approverId = await this.resolveApproverId(
      user.tenantId,
      context.versionId,
      supabase,
    );
    const now = new Date().toISOString();
    const approvalId = randomUUID();

    await supabase
      .from("processes")
      .update({ status: "under_review", updated_at: now })
      .eq("tenant_id", user.tenantId)
      .eq("id", processId);

    await supabase
      .from("process_versions")
      .update({ status: "under_review" })
      .eq("id", context.versionId);

    await supabase.from("approval_instances").insert({
      id: approvalId,
      tenant_id: user.tenantId,
      entity_type: "process_version",
      entity_id: context.versionId,
      process_id: processId,
      status: "pending",
      approver_id: approverId,
      submitted_by: user.id,
      submitted_at: now,
    });

    try {
      await this.workflowEngine.trigger(user, "sop_submitted_for_approval", {
        processId,
        approvalId,
        approverId: approverId ?? undefined,
      });
    } catch {
      // Supabase path: engine demo-only in Sprint 4
    }

    return { processId, approvalId, status: "under_review" };
  }

  async approve(
    user: AuthUser,
    processId: string,
    comment?: string,
    approvalId?: string,
  ) {
    await this.assertApprover(user, processId);
    const context = await this.loadProcessContext(user, processId);
    assertCanApprove(context.processStatus, context.versionStatus);

    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const result = processDemoStore.approveVersion(
        user.tenantId,
        processId,
        user.id,
        comment,
      );
      if (!result) {
        throw new ProcessAccessError(
          "FORBIDDEN",
          "No pending approval found for you.",
        );
      }
      return { processId, status: "approved", approvalId: result.approvalId };
    }

    const pending = await this.findPendingApproval(
      user.tenantId,
      processId,
      context.versionId,
      user.id,
      approvalId,
      supabase,
    );

    const now = new Date().toISOString();
    await supabase
      .from("processes")
      .update({ status: "under_review", updated_at: now })
      .eq("tenant_id", user.tenantId)
      .eq("id", processId);

    await supabase
      .from("process_versions")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: now,
      })
      .eq("id", context.versionId);

    await supabase
      .from("approval_instances")
      .update({
        status: "approved",
        decided_at: now,
        comment: comment ?? null,
      })
      .eq("id", pending.id);

    return { processId, status: "approved", approvalId: pending.id };
  }

  async reject(
    user: AuthUser,
    processId: string,
    comment: string,
    approvalId?: string,
  ) {
    if (!comment?.trim()) {
      throw new ProcessLifecycleError(
        "COMMENT_REQUIRED",
        "Rejection comment is required.",
      );
    }

    await this.assertApprover(user, processId);
    const context = await this.loadProcessContext(user, processId);
    assertCanReject(context.processStatus, context.versionStatus);

    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const result = processDemoStore.rejectVersion(
        user.tenantId,
        processId,
        user.id,
        comment.trim(),
      );
      if (!result) {
        throw new ProcessAccessError(
          "FORBIDDEN",
          "No pending approval found for you.",
        );
      }
      return { processId, status: "draft", approvalId: result.approvalId };
    }

    const pending = await this.findPendingApproval(
      user.tenantId,
      processId,
      context.versionId,
      user.id,
      approvalId,
      supabase,
    );

    const now = new Date().toISOString();
    await supabase
      .from("processes")
      .update({ status: "draft", updated_at: now })
      .eq("tenant_id", user.tenantId)
      .eq("id", processId);

    await supabase
      .from("process_versions")
      .update({ status: "rejected" })
      .eq("id", context.versionId);

    await supabase
      .from("approval_instances")
      .update({
        status: "rejected",
        decided_at: now,
        comment: comment.trim(),
      })
      .eq("id", pending.id);

    return { processId, status: "draft", approvalId: pending.id };
  }

  async createVersion(user: AuthUser, processId: string) {
    const context = await this.loadProcessContext(user, processId);
    assertProcessEdit(context.access);
    assertCanCreateVersion(context.processStatus);

    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const result = processDemoStore.createNewVersion(
        user.tenantId,
        processId,
        user.id,
      );
      if (!result) {
        throw new ProcessLifecycleError(
          "INVALID_TRANSITION",
          "Cannot create a new version.",
        );
      }
      return {
        processId,
        versionId: result.version.id,
        versionNumber: result.version.versionNumber,
        status: "draft",
      };
    }

    const { data: versions } = await supabase
      .from("process_versions")
      .select("version_number")
      .eq("process_id", processId)
      .order("version_number", { ascending: false })
      .limit(1);

    const nextNumber = (versions?.[0]?.version_number ?? 0) + 1;
    const versionId = randomUUID();
    const now = new Date().toISOString();

    const { data: steps } = await supabase
      .from("process_steps")
      .select("*")
      .eq("process_version_id", context.versionId);

    const { data: people } = await supabase
      .from("process_version_people")
      .select("user_id, role")
      .eq("process_version_id", context.versionId);

    await supabase.from("process_versions").insert({
      id: versionId,
      tenant_id: user.tenantId,
      process_id: processId,
      version_number: nextNumber,
      status: "draft",
      change_summary: `Draft v${nextNumber}`,
      created_by: user.id,
      created_at: now,
    });

    if (steps?.length) {
      await supabase.from("process_steps").insert(
        steps.map((step) => ({
          tenant_id: user.tenantId,
          process_version_id: versionId,
          step_number: step.step_number,
          title: step.title,
          description: step.description,
          responsible_role: step.responsible_role,
          step_type: step.step_type,
          inputs: step.inputs,
          outputs: step.outputs,
          controls: step.controls,
          notes: step.notes,
          evidence_required: step.evidence_required,
        })),
      );
    }

    if (people?.length) {
      await supabase.from("process_version_people").insert(
        people.map((person) => ({
          process_version_id: versionId,
          user_id: person.user_id,
          role: person.role,
        })),
      );
    }

    await supabase
      .from("processes")
      .update({
        status: "draft",
        current_version_id: versionId,
        updated_at: now,
      })
      .eq("tenant_id", user.tenantId)
      .eq("id", processId);

    return {
      processId,
      versionId,
      versionNumber: nextNumber,
      status: "draft",
    };
  }

  async listVersions(user: AuthUser, processId: string) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const process = processDemoStore.getProcess(user.tenantId, processId);
      if (!process) {
        return null;
      }
      return processDemoStore.listVersions(processId).map((version) => ({
        id: version.id,
        versionNumber: version.versionNumber,
        status: version.status,
        changeSummary: version.changeSummary,
        createdAt: version.createdAt,
        approvedBy: version.approvedBy,
        approvedAt: version.approvedAt,
        rejectedBy: version.rejectedBy,
        rejectedAt: version.rejectedAt,
        rejectionComment: version.rejectionComment,
        effectiveDate: version.effectiveDate,
        reviewDueDate: version.reviewDueDate,
        publishedAt: version.publishedAt,
        publishedBy: version.publishedBy,
        archivedAt: version.archivedAt,
        isCurrent: version.id === process.currentVersionId,
      }));
    }

    const { data: process } = await supabase
      .from("processes")
      .select("current_version_id")
      .eq("tenant_id", user.tenantId)
      .eq("id", processId)
      .maybeSingle();

    if (!process) {
      return null;
    }

    const { data, error } = await supabase
      .from("process_versions")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .eq("process_id", processId)
      .order("version_number", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((version) => ({
      id: version.id,
      versionNumber: version.version_number,
      status: version.status,
      changeSummary: version.change_summary ?? undefined,
      createdAt: version.created_at,
      approvedBy: version.approved_by ?? undefined,
      approvedAt: version.approved_at ?? undefined,
      effectiveDate: version.effective_date ?? undefined,
      reviewDueDate: version.review_due_date ?? undefined,
      publishedAt: version.published_at ?? undefined,
      publishedBy: version.published_by ?? undefined,
      archivedAt: version.archived_at ?? undefined,
      isCurrent: version.id === process.current_version_id,
    }));
  }

  private async assertApprover(user: AuthUser, processId: string) {
    if (!hasPermissionGrant(user, "processes", "approve")) {
      throw new ProcessAccessError(
        "FORBIDDEN",
        "You are not allowed to approve processes.",
      );
    }

    const context = await this.loadProcessContext(user, processId);
    if (
      !assertScopedPermission(
        user,
        { resource: "processes", action: "approve", scope: "function" },
        { functionId: context.functionId },
      )
    ) {
      throw new ProcessAccessError(
        "FORBIDDEN",
        "You are not allowed to approve processes in this function.",
      );
    }
  }

  private async loadProcessContext(user: AuthUser, processId: string) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const process = processDemoStore.getProcess(user.tenantId, processId);
      if (!process) {
        throw new ProcessLifecycleError("NOT_FOUND", "Process not found.");
      }
      const version = processDemoStore.getVersion(process.currentVersionId);
      if (!version) {
        throw new ProcessLifecycleError("NOT_FOUND", "Version not found.");
      }
      const people = processDemoStore.listPeople(process.currentVersionId);
      const access = resolveProcessAccess(
        user,
        people,
        process.createdBy,
        process.functionId,
      );
      return {
        versionId: version.id,
        processStatus: process.status,
        versionStatus: version.status,
        functionId: process.functionId,
        access,
      };
    }

    const { data: process } = await supabase
      .from("processes")
      .select("id, status, current_version_id, created_by, function_id")
      .eq("tenant_id", user.tenantId)
      .eq("id", processId)
      .maybeSingle();

    if (!process?.current_version_id) {
      throw new ProcessLifecycleError("NOT_FOUND", "Process not found.");
    }

    const { data: version } = await supabase
      .from("process_versions")
      .select("id, status")
      .eq("id", process.current_version_id)
      .maybeSingle();

    const people = await supabase
      .from("process_version_people")
      .select("user_id, role")
      .eq("process_version_id", process.current_version_id);

    const access = resolveProcessAccess(
      user,
      (people.data ?? []).map((person) => ({
        userId: person.user_id ?? undefined,
        role: person.role,
      })),
      process.created_by as string | undefined,
      process.function_id as string,
    );

    return {
      versionId: process.current_version_id as string,
      functionId: process.function_id as string,
      processStatus: process.status as "draft" | "under_review" | "active" | "retired",
      versionStatus: (version?.status ?? "draft") as
        | "draft"
        | "under_review"
        | "active"
        | "superseded"
        | "rejected",
      access,
    };
  }

  private async resolveApproverId(
    tenantId: string,
    versionId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data } = await supabase
      .from("process_version_people")
      .select("user_id")
      .eq("process_version_id", versionId)
      .eq("role", "approver")
      .maybeSingle();

    if (data?.user_id) {
      return data.user_id as string;
    }

    const { data: fallback } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(1)
      .maybeSingle();

    return (fallback?.id as string) ?? userIdFallback();
  }

  private async findPendingApproval(
    tenantId: string,
    processId: string,
    versionId: string,
    approverId: string,
    approvalId: string | undefined,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    let query = supabase
      .from("approval_instances")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .eq("approver_id", approverId);

    if (approvalId) {
      query = query.eq("id", approvalId);
    } else {
      query = query.eq("process_id", processId).eq("entity_id", versionId);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw new ProcessAccessError(
        "FORBIDDEN",
        "No pending approval found for you.",
      );
    }
    return data;
  }

  private async enrichApproval(item: {
    id: string;
    tenantId: string;
    processId: string;
    entityId: string;
    status: string;
    submittedBy?: string;
    submittedAt: string;
    approverId?: string;
    comment?: string;
  }) {
    const process = processDemoStore.getProcess(item.tenantId, item.processId);
    return {
      id: item.id,
      processId: item.processId,
      processName: process?.name ?? "Process",
      processCode: process?.processCode,
      functionName: process?.functionName,
      processAreaName: process?.processAreaName,
      entityId: item.entityId,
      status: item.status,
      submittedBy: item.submittedBy,
      submittedAt: item.submittedAt,
      approverId: item.approverId,
      comment: item.comment,
    };
  }

  private async enrichApprovalFromRow(row: Record<string, unknown>) {
    const processId = row.process_id as string;
    const supabase = getSupabaseAdminClient();
    let processName = "Process";
    let processCode: string | undefined;
    let functionName: string | undefined;
    let processAreaName: string | undefined;

    if (supabase) {
      const { data } = await supabase
        .from("processes")
        .select(
          "name, process_code, tenant_functions(name), tenant_process_areas(name)",
        )
        .eq("id", processId)
        .maybeSingle();
      if (data) {
        processName = data.name as string;
        processCode = (data.process_code as string) ?? undefined;
        functionName =
          (data.tenant_functions as { name?: string } | null)?.name ?? undefined;
        processAreaName =
          (data.tenant_process_areas as { name?: string } | null)?.name ??
          undefined;
      }
    }

    return {
      id: row.id as string,
      processId,
      processName,
      processCode,
      functionName,
      processAreaName,
      entityId: row.entity_id as string,
      status: row.status as string,
      submittedBy: (row.submitted_by as string) ?? undefined,
      submittedAt: row.submitted_at as string,
      approverId: (row.approver_id as string) ?? undefined,
      comment: (row.comment as string) ?? undefined,
    };
  }

  private toApprovalSummary(item: {
    id: string;
    status: string;
    submittedBy?: string;
    submittedAt: string;
    decidedAt?: string;
    comment?: string;
    approverId?: string;
  }) {
    return {
      id: item.id,
      status: item.status,
      submittedBy: item.submittedBy,
      submittedAt: item.submittedAt,
      decidedAt: item.decidedAt,
      comment: item.comment,
      approverId: item.approverId,
    };
  }

  private toApprovalSummaryFromRow(row: Record<string, unknown>) {
    return {
      id: row.id as string,
      status: row.status as string,
      submittedBy: (row.submitted_by as string) ?? undefined,
      submittedAt: row.submitted_at as string,
      decidedAt: (row.decided_at as string) ?? undefined,
      comment: (row.comment as string) ?? undefined,
      approverId: (row.approver_id as string) ?? undefined,
    };
  }
}

function userIdFallback() {
  return "user-gis-head";
}
