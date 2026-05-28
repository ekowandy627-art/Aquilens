import {
  ConflictException,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthUser } from "../auth/auth.types";
import { getDemoUserProfile, listDemoUsers } from "../auth/demo-users";
import { AuditService } from "../audit/audit.service";
import { getSupabaseForUser } from "../demo/demo-data-mode";
import { notificationDemoStore } from "../notifications/notification-demo.store";
import { processDemoStore } from "../processes/process-demo.store";
import {
  acknowledgementDemoStore,
  type AcknowledgementAssignmentRecord,
} from "./acknowledgement-demo.store";
import { completionRate } from "./acknowledgement-status";
import * as ackSupabase from "./acknowledgements-supabase";

function validationError(message: string) {
  return new HttpException(
    {
      success: false,
      error: { code: "VALIDATION_ERROR", message, status: 422 },
    },
    422,
  );
}

@Injectable()
export class AcknowledgementsService {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  async createCampaignFromPublish(
    user: AuthUser,
    processId: string,
    processVersionId: string,
    input: { dueDate?: string; userIds?: string[] },
  ) {
    const process = processDemoStore.getProcess(user.tenantId, processId);
    const supabase = getSupabaseForUser(user);

    if (supabase) {
      const { data: remoteProcess } = await supabase
        .from("processes")
        .select("id, acknowledgement_required")
        .eq("tenant_id", user.tenantId)
        .eq("id", processId)
        .maybeSingle();

      if (!remoteProcess?.acknowledgement_required) {
        return null;
      }

      const userIds = input.userIds?.length
        ? input.userIds
        : await this.defaultAssigneeIdsSupabase(supabase, user.tenantId);

      const { campaign, assignments } = await ackSupabase.insertCampaign(supabase, {
        tenantId: user.tenantId,
        processId,
        processVersionId,
        userIds,
        dueDate: input.dueDate,
        createdBy: user.id,
      });

      await this.audit.log(user, {
        eventType: "acknowledgement.assigned",
        entityType: "AcknowledgementCampaign",
        entityId: campaign.id,
        entityName: processId,
        action: `Assigned ${assignments.length} staff to acknowledge SOP`,
        afterState: { campaignId: campaign.id, assignmentCount: assignments.length },
      });

      return campaign;
    }

    if (!process?.acknowledgementRequired) {
      return null;
    }

    const userIds = input.userIds?.length
      ? input.userIds
      : this.defaultAssigneeIds(user.tenantId);

    processDemoStore.ensureViewerAccess(processVersionId, userIds);

    const { campaign, assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: user.tenantId,
      processId,
      processVersionId,
      userIds,
      dueDate: input.dueDate,
      createdBy: user.id,
    });

    await this.audit.log(user, {
      eventType: "acknowledgement.assigned",
      entityType: "AcknowledgementCampaign",
      entityId: campaign.id,
      entityName: process.name,
      action: `Assigned ${assignments.length} staff to acknowledge ${process.name}`,
      afterState: { campaign, assignmentCount: assignments.length },
    });

    this.notifyRequired(assignments, process.name, user.tenantId);

    return campaign;
  }

  async createCampaign(
    user: AuthUser,
    processId: string,
    input: { userIds: string[]; dueDate?: string },
  ) {
    this.assertUserIds(input.userIds);

    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const { data: process } = await supabase
        .from("processes")
        .select("id, current_version_id, name")
        .eq("tenant_id", user.tenantId)
        .eq("id", processId)
        .maybeSingle();

      if (!process) {
        throw new NotFoundException({
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        });
      }

      const versionId = process.current_version_id as string | null;
      if (!versionId) {
        throw new ConflictException({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Process has no current version.",
            status: 422,
          },
        });
      }

      const { campaign, assignments } = await ackSupabase.insertCampaign(supabase, {
        tenantId: user.tenantId,
        processId,
        processVersionId: versionId,
        userIds: input.userIds,
        dueDate: input.dueDate,
        createdBy: user.id,
      });

      await this.audit.log(user, {
        eventType: "acknowledgement.assigned",
        entityType: "AcknowledgementCampaign",
        entityId: campaign.id,
        entityName: process.name as string,
        action: `Manual acknowledgement campaign for ${process.name as string}`,
        afterState: { campaign, assignments },
      });

      return {
        campaign,
        assignments: await Promise.all(
          assignments.map((row) => this.enrichAssignmentSupabase(supabase, row)),
        ),
      };
    }

    const process = processDemoStore.getProcess(user.tenantId, processId);
    if (!process) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
      });
    }

    const versionId = process.currentVersionId;
    if (!versionId) {
      throw new ConflictException({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Process has no current version.",
          status: 422,
        },
      });
    }

    processDemoStore.ensureViewerAccess(versionId, input.userIds);

    const { campaign, assignments } = acknowledgementDemoStore.createCampaign({
      tenantId: user.tenantId,
      processId,
      processVersionId: versionId,
      userIds: input.userIds,
      dueDate: input.dueDate,
      createdBy: user.id,
    });

    await this.audit.log(user, {
      eventType: "acknowledgement.assigned",
      entityType: "AcknowledgementCampaign",
      entityId: campaign.id,
      entityName: process.name,
      action: `Manual acknowledgement campaign for ${process.name}`,
      afterState: { campaign, assignments },
    });

    this.notifyRequired(assignments, process.name, user.tenantId);

    return { campaign, assignments: assignments.map((row) => this.enrichAssignment(row)) };
  }

  async listMyPending(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const rows = await ackSupabase.listAssignmentsForUser(
        supabase,
        user.tenantId,
        user.id,
      );
      const enriched = await Promise.all(
        rows.map((row) => this.enrichAssignmentSupabase(supabase, row)),
      );
      return enriched.filter(
        (row) => row.status === "pending" || row.status === "overdue",
      );
    }

    return acknowledgementDemoStore
      .listPendingForUser(user.tenantId, user.id)
      .map((row) => this.enrichAssignment(row));
  }

  async getAssignmentSop(user: AuthUser, assignmentId: string) {
    const assignment = await this.getAssignmentForUser(user, assignmentId);
    if (!assignment) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
      });
    }

    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const campaign = await ackSupabase.getCampaign(supabase, assignment.campaignId);
      if (!campaign) {
        throw new NotFoundException({
          success: false,
          error: { code: "NOT_FOUND", message: "Campaign not found.", status: 404 },
        });
      }

      const [{ data: process }, { data: version }, { data: steps }] = await Promise.all([
        supabase
          .from("processes")
          .select("id, name")
          .eq("id", campaign.process_id)
          .maybeSingle(),
        supabase
          .from("process_versions")
          .select("id, version_number, effective_date")
          .eq("id", campaign.process_version_id)
          .maybeSingle(),
        supabase
          .from("process_steps")
          .select("id, step_number, title, description, step_type, evidence_required")
          .eq("process_version_id", campaign.process_version_id)
          .order("step_number"),
      ]);

      return {
        assignmentId,
        processId: campaign.process_id,
        processName: (process?.name as string) ?? "SOP",
        processVersionId: campaign.process_version_id,
        versionNumber: version?.version_number as number | undefined,
        effectiveDate: version?.effective_date as string | undefined,
        steps: steps ?? [],
        readOnly: true,
      };
    }

    const campaign = acknowledgementDemoStore.getCampaign(assignment.campaignId);
    if (!campaign) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: "Campaign not found.", status: 404 },
      });
    }

    const process = processDemoStore.getProcess(user.tenantId, campaign.processId);
    const version = processDemoStore.getVersion(campaign.processVersionId);
    const steps = processDemoStore.listSteps(campaign.processVersionId);

    return {
      assignmentId,
      processId: campaign.processId,
      processName: process?.name ?? "SOP",
      processVersionId: campaign.processVersionId,
      versionNumber: version?.versionNumber,
      effectiveDate: version?.effectiveDate,
      steps: steps.map((step) => ({
        id: step.id,
        step_number: step.stepNumber,
        title: step.title,
        description: step.description,
        step_type: step.stepType,
        evidence_required: step.evidenceRequired,
      })),
      readOnly: true,
    };
  }

  async confirm(
    user: AuthUser,
    assignmentId: string,
    input: { userAgent?: string; processVersionId?: string },
  ) {
    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const assignment = await ackSupabase.getAssignment(
        supabase,
        user.tenantId,
        assignmentId,
      );
      if (!assignment) {
        throw new NotFoundException({
          success: false,
          error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
        });
      }
      if (assignment.user_id !== user.id) {
        throw new ForbiddenException({
          success: false,
          error: { code: "FORBIDDEN", message: "Not your assignment.", status: 403 },
        });
      }

      const result = await ackSupabase.confirmAssignment(supabase, user, assignment, input);
      if ("error" in result) {
        if (result.error === "VERSION_MISMATCH") {
          throw validationError("Acknowledgement must match the assigned SOP version.");
        }
        throw new NotFoundException({
          success: false,
          error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
        });
      }

      await this.audit.log(user, {
        eventType: "acknowledgement.completed",
        entityType: "AcknowledgementAssignment",
        entityId: assignmentId,
        action: "Acknowledged SOP",
        afterState: {
          acknowledgedAt: result.acknowledgement.acknowledged_at,
          processVersionId: result.acknowledgement.process_version_id,
        },
      });

      return {
        assignment: await this.enrichAssignmentSupabase(supabase, result.assignment),
        acknowledgement: result.acknowledgement,
      };
    }

    const assignment = acknowledgementDemoStore.getAssignment(assignmentId);
    if (!assignment || assignment.tenantId !== user.tenantId) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
      });
    }

    const campaign = acknowledgementDemoStore.getCampaign(assignment.campaignId);
    if (
      input.processVersionId &&
      campaign &&
      input.processVersionId !== campaign.processVersionId
    ) {
      throw validationError("Acknowledgement must match the assigned SOP version.");
    }

    const result = acknowledgementDemoStore.confirmAssignment(
      assignmentId,
      user.id,
      input,
    );

    if ("error" in result) {
      if (result.error === "FORBIDDEN") {
        throw new ForbiddenException({
          success: false,
          error: { code: "FORBIDDEN", message: "Not your assignment.", status: 403 },
        });
      }
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: "Assignment not found.", status: 404 },
      });
    }

    const process = this.processForCampaign(assignment);
    await this.audit.log(user, {
      eventType: "acknowledgement.completed",
      entityType: "AcknowledgementAssignment",
      entityId: assignmentId,
      entityName: process?.name,
      action: `Acknowledged ${process?.name ?? "SOP"}`,
      afterState: {
        acknowledgedAt: result.acknowledgement.acknowledgedAt,
        processVersionId: result.acknowledgement.processVersionId,
      },
    });

    return {
      assignment: this.enrichAssignment(result.assignment),
      acknowledgement: result.acknowledgement,
    };
  }

  async getProcessAcknowledgements(user: AuthUser, processId: string) {
    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const { data: process } = await supabase
        .from("processes")
        .select("id")
        .eq("tenant_id", user.tenantId)
        .eq("id", processId)
        .maybeSingle();

      if (!process) {
        throw new NotFoundException({
          success: false,
          error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
        });
      }

      const campaigns = await ackSupabase.listCampaignsForProcess(
        supabase,
        user.tenantId,
        processId,
      );

      const enriched = await Promise.all(
        campaigns.map(async (campaign) => {
          const assignments = await ackSupabase.listAssignmentsForCampaign(
            supabase,
            campaign.id,
          );
          const rows = await Promise.all(
            assignments.map((row) => this.enrichAssignmentSupabase(supabase, row, campaign)),
          );
          return {
            id: campaign.id,
            processId: campaign.process_id,
            processVersionId: campaign.process_version_id,
            dueDate: campaign.due_date ?? undefined,
            createdAt: campaign.created_at,
            assignments: rows,
            completionPercent: completionRate(rows),
          };
        }),
      );

      return { processId, campaigns: enriched };
    }

    const process = processDemoStore.getProcess(user.tenantId, processId);
    if (!process) {
      throw new NotFoundException({
        success: false,
        error: { code: "NOT_FOUND", message: "Process not found.", status: 404 },
      });
    }

    const campaigns = acknowledgementDemoStore
      .listCampaignsForProcess(user.tenantId, processId)
      .map((campaign) => {
        const assignments = acknowledgementDemoStore
          .listAssignmentsForCampaign(campaign.id)
          .map((row) => this.enrichAssignment(row));
        return {
          ...campaign,
          assignments,
          completionPercent: completionRate(assignments),
        };
      });

    return { processId, campaigns };
  }

  async listOverdue(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const { data, error } = await supabase
        .from("sop_acknowledgement_assignments")
        .select("*, sop_acknowledgement_campaigns(due_date, process_id)")
        .eq("tenant_id", user.tenantId)
        .in("status", ["pending", "overdue"]);

      if (error) {
        throw new Error(error.message);
      }

      const overdue = [];
      for (const row of data ?? []) {
        const campaign = row.sop_acknowledgement_campaigns as {
          due_date?: string | null;
          process_id?: string;
        } | null;
        const status = ackSupabase.resolveAssignmentStatus(
          row as ackSupabase.SupabaseAssignmentRow,
          campaign?.due_date,
        );
        if (status !== "overdue") {
          continue;
        }
        const enriched = await this.enrichAssignmentSupabase(
          supabase,
          row as ackSupabase.SupabaseAssignmentRow,
        );
        overdue.push({ ...enriched, status: "overdue" as const });
      }
      return overdue;
    }

    return acknowledgementDemoStore
      .listOverdue(user.tenantId)
      .map((row) => this.enrichAssignment(row));
  }

  private assertUserIds(userIds: string[] | undefined) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw validationError("At least one user id is required.");
    }
  }

  private defaultAssigneeIds(tenantId: string) {
    if (tenantId === "tenant-gis") {
      return ["user-gis-staff"];
    }
    const users = listDemoUsers(tenantId);
    return users.length > 0 ? [users[0]!.id] : [];
  }

  private async defaultAssigneeIdsSupabase(
    supabase: Awaited<ReturnType<typeof getSupabaseForUser>>,
    tenantId: string,
  ) {
    if (!supabase) {
      return this.defaultAssigneeIds(tenantId);
    }
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(20);
    return (data ?? []).map((row) => row.id as string).slice(0, 5);
  }

  private async getAssignmentForUser(user: AuthUser, assignmentId: string) {
    const supabase = getSupabaseForUser(user);
    if (supabase) {
      const row = await ackSupabase.getAssignment(supabase, user.tenantId, assignmentId);
      if (!row) {
        return null;
      }
      if (row.user_id !== user.id && !this.canReadAcknowledgements(user)) {
        throw new ForbiddenException({
          success: false,
          error: { code: "FORBIDDEN", message: "Insufficient permission.", status: 403 },
        });
      }
      return {
        id: row.id,
        tenantId: row.tenant_id,
        campaignId: row.campaign_id,
        userId: row.user_id,
        status: row.status,
      };
    }

    const assignment = acknowledgementDemoStore.getAssignment(assignmentId);
    if (!assignment || assignment.tenantId !== user.tenantId) {
      return null;
    }
    if (assignment.userId !== user.id && !this.canReadAcknowledgements(user)) {
      throw new ForbiddenException({
        success: false,
        error: { code: "FORBIDDEN", message: "Insufficient permission.", status: 403 },
      });
    }
    return assignment;
  }

  private canReadAcknowledgements(user: AuthUser) {
    return (
      user.permissions.includes("*") ||
      user.permissions.includes("acknowledgements:read")
    );
  }

  private notifyRequired(
    assignments: Array<{ id: string; userId: string; tenantId?: string }>,
    processName: string,
    tenantId: string,
  ) {
    for (const assignment of assignments) {
      notificationDemoStore.create({
        tenantId: assignment.tenantId ?? tenantId,
        userId: assignment.userId,
        type: "acknowledgement.required",
        title: `Acknowledge SOP: ${processName}`,
        body: "A published SOP requires your acknowledgement.",
        entityType: "acknowledgement_assignment",
        entityId: assignment.id,
        entityName: processName,
      });
    }
  }

  private maybeNotifyOverdue(
    assignment: AcknowledgementAssignmentRecord,
    processName: string,
  ) {
    if (assignment.status !== "overdue" || assignment.overdueNotified) {
      return;
    }
    acknowledgementDemoStore.markOverdueNotified(assignment.id);
    notificationDemoStore.create({
      tenantId: assignment.tenantId,
      userId: assignment.userId,
      type: "acknowledgement.overdue",
      title: `Overdue acknowledgement: ${processName}`,
      body: "Please read and acknowledge the assigned SOP.",
      entityType: "acknowledgement_assignment",
      entityId: assignment.id,
      entityName: processName,
    });
  }

  private processForCampaign(assignment: AcknowledgementAssignmentRecord) {
    const campaign = acknowledgementDemoStore.getCampaign(assignment.campaignId);
    if (!campaign) {
      return null;
    }
    return processDemoStore.getProcess(assignment.tenantId, campaign.processId);
  }

  private enrichAssignment(assignment: AcknowledgementAssignmentRecord) {
    const campaign = acknowledgementDemoStore.getCampaign(assignment.campaignId);
    const process = campaign
      ? processDemoStore.getProcess(assignment.tenantId, campaign.processId)
      : null;
    const version = campaign
      ? processDemoStore.getVersion(campaign.processVersionId)
      : null;
    const acknowledgement = acknowledgementDemoStore
      .listAcknowledgementsForUser(assignment.tenantId, assignment.userId)
      .find((row) => row.assignmentId === assignment.id);

    const refreshed = acknowledgementDemoStore
      .listAssignmentsForUser(assignment.tenantId, assignment.userId)
      .find((row) => row.id === assignment.id);
    const status = refreshed?.status ?? assignment.status;

    if (refreshed) {
      this.maybeNotifyOverdue(refreshed, process?.name ?? "SOP");
    }

    const profile = getDemoUserProfile(assignment.userId);

    return {
      id: assignment.id,
      campaignId: assignment.campaignId,
      processId: campaign?.processId ?? "",
      processName: process?.name ?? "SOP",
      processVersionId: campaign?.processVersionId ?? "",
      versionNumber: version?.versionNumber,
      userId: assignment.userId,
      userName: profile?.full_name ?? assignment.userId,
      userEmail: profile?.email,
      status,
      dueDate: assignment.dueDate ?? campaign?.dueDate,
      acknowledgedAt: acknowledgement?.acknowledgedAt,
    };
  }

  private async enrichAssignmentSupabase(
    supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseForUser>>>,
    row: ackSupabase.SupabaseAssignmentRow,
    campaignRow?: ackSupabase.SupabaseCampaignRow,
  ) {
    const campaign =
      campaignRow ?? (await ackSupabase.getCampaign(supabase, row.campaign_id));
    const status = ackSupabase.resolveAssignmentStatus(row, campaign?.due_date);

    const [{ data: process }, { data: version }, { data: user }] = await Promise.all([
      campaign
        ? supabase
            .from("processes")
            .select("name")
            .eq("id", campaign.process_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      campaign
        ? supabase
            .from("process_versions")
            .select("version_number")
            .eq("id", campaign.process_version_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("users").select("full_name, email").eq("id", row.user_id).maybeSingle(),
    ]);

    return {
      id: row.id,
      campaignId: row.campaign_id,
      processId: campaign?.process_id ?? "",
      processName: (process?.name as string) ?? "SOP",
      processVersionId: campaign?.process_version_id ?? "",
      versionNumber: version?.version_number as number | undefined,
      userId: row.user_id,
      userName: (user?.full_name as string) ?? row.user_id,
      userEmail: user?.email as string | undefined,
      status,
      dueDate: row.due_date ?? campaign?.due_date ?? undefined,
      acknowledgedAt: undefined as string | undefined,
    };
  }
}
