import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { generateProcessCode } from "./process-code";
import type { ExecutionSchedule } from "./execution-schedule";
import {
  assertProcessEdit,
  assertProcessPeopleManagement,
  assertProcessView,
  hasGlobalProcessRead,
  ProcessAccessError,
  resolveProcessAccess,
  validatePeopleAssignments,
  type ProcessPersonAssignment,
} from "./process-access";
import {
  processDemoStore,
  type CreateProcessInput,
  type CreateStepInput,
  type ProcessListFilters,
  type UpdateProcessInput,
} from "./process-demo.store";

type ScaffoldLookup = {
  functionName: string;
  areaName: string;
};

@Injectable()
export class ProcessesService {
  private readonly demo = processDemoStore;

  async list(user: AuthUser, filters: ProcessListFilters) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return this.demo
        .listProcesses(user.tenantId, filters)
        .filter((process) =>
          this.canViewProcess(user, process.currentVersionId, process.createdBy),
        )
        .map((process) => this.toListItem(process));
    }

    let query = supabase
      .from("processes")
      .select(
        "id, tenant_id, function_id, process_area_id, process_code, name, description, purpose, status, risk_rating, review_frequency, execution_schedule, approval_required, tags, created_at, updated_at, created_by, current_version_id, tenant_functions(name), tenant_process_areas(name)",
      )
      .eq("tenant_id", user.tenantId)
      .neq("status", "retired")
      .order("updated_at", { ascending: false });

    if (filters.status) query = query.eq("status", filters.status);
    if (filters.riskRating) query = query.eq("risk_rating", filters.riskRating);
    if (filters.functionId) query = query.eq("function_id", filters.functionId);
    if (filters.tag) query = query.contains("tags", [filters.tag]);

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    const visible = [];

    for (const row of rows) {
      const people = row.current_version_id
        ? await this.loadPeople(row.current_version_id as string, supabase)
        : [];
      if (
        this.canViewProcess(
          user,
          row.current_version_id as string,
          row.created_by as string | undefined,
          people,
        )
      ) {
        visible.push(row);
      }
    }

    return visible.map((row) => ({
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
      executionSchedule: (row.execution_schedule ?? {
        kind: "ad_hoc",
      }) as ExecutionSchedule,
      approvalRequired: row.approval_required,
      tags: row.tags ?? [],
      functionName:
        (row.tenant_functions as { name?: string } | null)?.name ?? undefined,
      processAreaName:
        (row.tenant_process_areas as { name?: string } | null)?.name ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getDetail(user: AuthUser, processId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const process = this.demo.getProcess(user.tenantId, processId);
      if (!process) {
        return null;
      }
      const version = this.demo.getVersion(process.currentVersionId);
      const steps = this.demo.listSteps(process.currentVersionId);
      const people = this.demo.listPeople(process.currentVersionId);
      const access = resolveProcessAccess(user, people, process.createdBy);
      assertProcessView(access);

      return {
        ...this.toDetail(process),
        access,
        currentVersion: version
          ? {
              id: version.id,
              versionNumber: version.versionNumber,
              status: version.status,
              changeSummary: version.changeSummary,
              createdAt: version.createdAt,
            }
          : null,
        steps: steps.map((step) => this.toStep(step)),
        people: people.map((person) => ({
          id: person.id,
          userId: person.userId,
          role: person.role,
        })),
      };
    }

    const { data: process, error } = await supabase
      .from("processes")
      .select(
        "*, tenant_functions(name), tenant_process_areas(name)",
      )
      .eq("tenant_id", user.tenantId)
      .eq("id", processId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!process) {
      return null;
    }

    const versionId = process.current_version_id as string | null;
    const [versionResult, stepsResult, peopleResult] = versionId
      ? await Promise.all([
          supabase
            .from("process_versions")
            .select("id, version_number, status, change_summary, created_at")
            .eq("id", versionId)
            .maybeSingle(),
          supabase
            .from("process_steps")
            .select("*")
            .eq("process_version_id", versionId)
            .order("step_number"),
          supabase
            .from("process_version_people")
            .select("id, user_id, role")
            .eq("process_version_id", versionId),
        ])
      : [{ data: null }, { data: [] }, { data: [] }];

    const people = (peopleResult.data ?? []).map((person) => ({
      id: person.id,
      userId: person.user_id ?? undefined,
      role: person.role,
    }));
    const access = resolveProcessAccess(
      user,
      people,
      process.created_by as string | undefined,
    );
    assertProcessView(access);

    return {
      id: process.id,
      functionId: process.function_id,
      processAreaId: process.process_area_id,
      processCode: process.process_code ?? undefined,
      name: process.name,
      description: process.description ?? undefined,
      purpose: process.purpose ?? undefined,
      whoItAffects: process.who_it_affects ?? [],
      linkedSystems: process.linked_systems ?? [],
      linkedPolicies: process.linked_policies ?? undefined,
      tags: process.tags ?? [],
      riskRating: process.risk_rating,
      riskNotes: process.risk_notes ?? undefined,
      governanceControls: process.governance_controls ?? [],
      approvalRequired: process.approval_required,
      reviewFrequency: process.review_frequency,
      executionSchedule: (process.execution_schedule ?? {
        kind: "ad_hoc",
      }) as ExecutionSchedule,
      regulatoryReference: process.regulatory_reference ?? undefined,
      status: process.status,
      functionName:
        (process.tenant_functions as { name?: string } | null)?.name ?? undefined,
      processAreaName:
        (process.tenant_process_areas as { name?: string } | null)?.name ??
        undefined,
      createdAt: process.created_at,
      updatedAt: process.updated_at,
      access,
      currentVersion: versionResult.data
        ? {
            id: versionResult.data.id,
            versionNumber: versionResult.data.version_number,
            status: versionResult.data.status,
            changeSummary: versionResult.data.change_summary ?? undefined,
            createdAt: versionResult.data.created_at,
          }
        : null,
      steps: (stepsResult.data ?? []).map((step) => ({
        id: step.id,
        stepNumber: step.step_number,
        title: step.title,
        description: step.description ?? undefined,
        responsibleRole: step.responsible_role ?? undefined,
        stepType: step.step_type,
        inputs: step.inputs ?? undefined,
        outputs: step.outputs ?? undefined,
        controls: step.controls ?? undefined,
        notes: step.notes ?? undefined,
        evidenceRequired: step.evidence_required,
      })),
      people,
    };
  }

  async getAccess(user: AuthUser, processId: string) {
    const detail = await this.getDetail(user, processId);
    if (!detail) {
      return null;
    }
    return detail.access;
  }

  async create(user: AuthUser, input: CreateProcessInput) {
    const supabase = getSupabaseAdminClient();
    const scaffold = await this.lookupScaffold(user, input.functionId, input.processAreaId);

    if (!supabase) {
      const { process, version } = this.demo.createProcess(
        user.tenantId,
        user.id,
        input,
        scaffold,
      );
      this.demo.replacePeople(version.id, [{ userId: user.id, role: "owner" }]);
      return { id: process.id, processCode: process.processCode };
    }

    const sequence = await this.nextSequenceNumber(
      user.tenantId,
      input.functionId,
      input.processAreaId,
    );
    const processId = randomUUID();
    const versionId = randomUUID();
    const processCode = generateProcessCode(
      scaffold.functionName,
      scaffold.areaName,
      sequence,
    );

    const { error: processError } = await supabase.from("processes").insert({
      id: processId,
      tenant_id: user.tenantId,
      function_id: input.functionId,
      process_area_id: input.processAreaId,
      process_code: processCode,
      name: input.name,
      description: input.description,
      purpose: input.purpose,
      who_it_affects: input.whoItAffects ?? [],
      linked_systems: input.linkedSystems ?? [],
      linked_policies: input.linkedPolicies,
      tags: input.tags ?? [],
      risk_rating: input.riskRating ?? "medium",
      risk_notes: input.riskNotes,
      governance_controls: input.governanceControls ?? [],
      approval_required: input.approvalRequired ?? false,
      review_frequency: input.reviewFrequency ?? "annually",
      execution_schedule: input.executionSchedule ?? { kind: "ad_hoc" },
      creation_source: input.creationSource ?? "manual",
      regulatory_reference: input.regulatoryReference,
      status: "draft",
      current_version_id: versionId,
      created_by: user.id,
    });

    if (processError) {
      throw new Error(processError.message);
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
      throw new Error(versionError.message);
    }

    await supabase.from("process_version_people").insert({
      process_version_id: versionId,
      user_id: user.id,
      role: "owner",
    });

    return { id: processId, processCode };
  }

  async update(user: AuthUser, processId: string, patch: UpdateProcessInput) {
    await this.requireEditAccess(user, processId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const updated = this.demo.updateProcess(user.tenantId, processId, patch);
      if (!updated) {
        return null;
      }
      return { id: updated.id };
    }

    const payload: Record<string, unknown> = {};
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.purpose !== undefined) payload.purpose = patch.purpose;
    if (patch.whoItAffects !== undefined) payload.who_it_affects = patch.whoItAffects;
    if (patch.linkedSystems !== undefined) payload.linked_systems = patch.linkedSystems;
    if (patch.linkedPolicies !== undefined) payload.linked_policies = patch.linkedPolicies;
    if (patch.tags !== undefined) payload.tags = patch.tags;
    if (patch.riskRating !== undefined) payload.risk_rating = patch.riskRating;
    if (patch.riskNotes !== undefined) payload.risk_notes = patch.riskNotes;
    if (patch.governanceControls !== undefined)
      payload.governance_controls = patch.governanceControls;
    if (patch.approvalRequired !== undefined)
      payload.approval_required = patch.approvalRequired;
    if (patch.reviewFrequency !== undefined)
      payload.review_frequency = patch.reviewFrequency;
    if (patch.executionSchedule !== undefined)
      payload.execution_schedule = patch.executionSchedule;
    if (patch.regulatoryReference !== undefined)
      payload.regulatory_reference = patch.regulatoryReference;
    if (patch.status !== undefined) payload.status = patch.status;

    const { error } = await supabase
      .from("processes")
      .update(payload)
      .eq("tenant_id", user.tenantId)
      .eq("id", processId);

    if (error) {
      throw new Error(error.message);
    }

    return { id: processId };
  }

  async retire(user: AuthUser, processId: string) {
    await this.requireEditAccess(user, processId);
    return this.update(user, processId, { status: "retired" });
  }

  async addStep(
    user: AuthUser,
    processId: string,
    versionId: string,
    input: CreateStepInput,
  ) {
    await this.requireEditAccess(user, processId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      await this.assertVersionAccess(user, processId, versionId);
      const step = this.demo.addStep(user.tenantId, versionId, input);
      return this.toStep(step);
    }

    await this.assertVersionAccess(user, processId, versionId, supabase);

    const { data, error } = await supabase
      .from("process_steps")
      .insert({
        tenant_id: user.tenantId,
        process_version_id: versionId,
        step_number: input.stepNumber,
        title: input.title,
        description: input.description,
        responsible_role: input.responsibleRole,
        step_type: input.stepType ?? "manual",
        inputs: input.inputs,
        outputs: input.outputs,
        controls: input.controls,
        notes: input.notes,
        evidence_required: input.evidenceRequired ?? false,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      stepNumber: data.step_number,
      title: data.title,
      description: data.description ?? undefined,
      responsibleRole: data.responsible_role ?? undefined,
      stepType: data.step_type,
      inputs: data.inputs ?? undefined,
      outputs: data.outputs ?? undefined,
      controls: data.controls ?? undefined,
      notes: data.notes ?? undefined,
      evidenceRequired: data.evidence_required,
    };
  }

  async updateStep(
    user: AuthUser,
    processId: string,
    versionId: string,
    stepId: string,
    patch: Partial<CreateStepInput>,
  ) {
    await this.requireEditAccess(user, processId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      await this.assertVersionAccess(user, processId, versionId);
      const updated = this.demo.updateStep(stepId, {
        title: patch.title,
        description: patch.description,
        responsibleRole: patch.responsibleRole,
        stepType: patch.stepType,
        inputs: patch.inputs,
        outputs: patch.outputs,
        controls: patch.controls,
        notes: patch.notes,
        evidenceRequired: patch.evidenceRequired,
        stepNumber: patch.stepNumber,
      });
      if (!updated) {
        return null;
      }
      return this.toStep(updated);
    }

    await this.assertVersionAccess(user, processId, versionId, supabase);

    const payload: Record<string, unknown> = {};
    if (patch.stepNumber !== undefined) payload.step_number = patch.stepNumber;
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.description !== undefined) payload.description = patch.description;
    if (patch.responsibleRole !== undefined)
      payload.responsible_role = patch.responsibleRole;
    if (patch.stepType !== undefined) payload.step_type = patch.stepType;
    if (patch.inputs !== undefined) payload.inputs = patch.inputs;
    if (patch.outputs !== undefined) payload.outputs = patch.outputs;
    if (patch.controls !== undefined) payload.controls = patch.controls;
    if (patch.notes !== undefined) payload.notes = patch.notes;
    if (patch.evidenceRequired !== undefined)
      payload.evidence_required = patch.evidenceRequired;

    const { data, error } = await supabase
      .from("process_steps")
      .update(payload)
      .eq("tenant_id", user.tenantId)
      .eq("id", stepId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      stepNumber: data.step_number,
      title: data.title,
      description: data.description ?? undefined,
      responsibleRole: data.responsible_role ?? undefined,
      stepType: data.step_type,
      inputs: data.inputs ?? undefined,
      outputs: data.outputs ?? undefined,
      controls: data.controls ?? undefined,
      notes: data.notes ?? undefined,
      evidenceRequired: data.evidence_required,
    };
  }

  async deleteStep(
    user: AuthUser,
    processId: string,
    versionId: string,
    stepId: string,
  ) {
    await this.requireEditAccess(user, processId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      await this.assertVersionAccess(user, processId, versionId);
      this.demo.deleteStep(stepId);
      return { id: stepId };
    }

    await this.assertVersionAccess(user, processId, versionId, supabase);

    const { error } = await supabase
      .from("process_steps")
      .delete()
      .eq("tenant_id", user.tenantId)
      .eq("id", stepId);

    if (error) {
      throw new Error(error.message);
    }

    return { id: stepId };
  }

  async reorderSteps(
    user: AuthUser,
    processId: string,
    versionId: string,
    orderedIds: string[],
  ) {
    await this.requireEditAccess(user, processId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      await this.assertVersionAccess(user, processId, versionId);
      const steps = this.demo.reorderSteps(versionId, orderedIds);
      return steps.map((step) => this.toStep(step));
    }

    await this.assertVersionAccess(user, processId, versionId, supabase);

    for (const [index, stepId] of orderedIds.entries()) {
      const { error } = await supabase
        .from("process_steps")
        .update({ step_number: index + 1 })
        .eq("tenant_id", user.tenantId)
        .eq("id", stepId);

      if (error) {
        throw new Error(error.message);
      }
    }

    const { data, error } = await supabase
      .from("process_steps")
      .select("*")
      .eq("process_version_id", versionId)
      .order("step_number");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((step) => ({
      id: step.id,
      stepNumber: step.step_number,
      title: step.title,
      description: step.description ?? undefined,
      responsibleRole: step.responsible_role ?? undefined,
      stepType: step.step_type,
      inputs: step.inputs ?? undefined,
      outputs: step.outputs ?? undefined,
      controls: step.controls ?? undefined,
      notes: step.notes ?? undefined,
      evidenceRequired: step.evidence_required,
    }));
  }

  async replacePeople(
    user: AuthUser,
    processId: string,
    versionId: string,
    entries: ProcessPersonAssignment[],
  ) {
    const access = await this.requirePeopleManagementAccess(user, processId);
    validatePeopleAssignments(
      entries,
      user.id,
      user.permissions.includes("*"),
    );
    assertProcessPeopleManagement(user, access);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      await this.assertVersionAccess(user, processId, versionId);
      return this.demo.replacePeople(versionId, entries);
    }

    await this.assertVersionAccess(user, processId, versionId, supabase);

    await supabase
      .from("process_version_people")
      .delete()
      .eq("process_version_id", versionId);

    if (entries.length > 0) {
      const { error } = await supabase.from("process_version_people").insert(
        entries.map((entry) => ({
          process_version_id: versionId,
          user_id: entry.userId,
          role: entry.role,
        })),
      );

      if (error) {
        throw new Error(error.message);
      }
    }

    const { data } = await supabase
      .from("process_version_people")
      .select("id, user_id, role")
      .eq("process_version_id", versionId);

    return (data ?? []).map((person) => ({
      id: person.id,
      userId: person.user_id ?? undefined,
      role: person.role,
    }));
  }

  private canViewProcess(
    user: AuthUser,
    versionId: string,
    createdBy?: string,
    people: ProcessPersonAssignment[] = [],
  ) {
    if (!versionId) {
      return hasGlobalProcessRead(user);
    }

    const resolvedPeople =
      people.length > 0
        ? people
        : this.demo.listPeople(versionId).map((person) => ({
            userId: person.userId,
            role: person.role,
          }));

    return resolveProcessAccess(user, resolvedPeople, createdBy).canView;
  }

  private async requireEditAccess(user: AuthUser, processId: string) {
    const detail = await this.loadProcessAccessContext(user, processId);
    if (!detail) {
      throw new ProcessAccessError("NOT_FOUND", "Process not found.");
    }
    assertProcessEdit(detail.access);
    return detail;
  }

  private async requirePeopleManagementAccess(user: AuthUser, processId: string) {
    const detail = await this.loadProcessAccessContext(user, processId);
    if (!detail) {
      throw new ProcessAccessError("NOT_FOUND", "Process not found.");
    }
    return detail.access;
  }

  private async loadProcessAccessContext(user: AuthUser, processId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const process = this.demo.getProcess(user.tenantId, processId);
      if (!process) {
        return null;
      }
      const people = this.demo.listPeople(process.currentVersionId);
      return {
        access: resolveProcessAccess(user, people, process.createdBy),
      };
    }

    const { data: process } = await supabase
      .from("processes")
      .select("id, created_by, current_version_id")
      .eq("tenant_id", user.tenantId)
      .eq("id", processId)
      .maybeSingle();

    if (!process?.current_version_id) {
      return null;
    }

    const people = await this.loadPeople(process.current_version_id as string, supabase);
    return {
      access: resolveProcessAccess(
        user,
        people,
        process.created_by as string | undefined,
      ),
    };
  }

  private async loadPeople(
    versionId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data } = await supabase
      .from("process_version_people")
      .select("user_id, role")
      .eq("process_version_id", versionId);

    return (data ?? []).map((person) => ({
      userId: person.user_id ?? undefined,
      role: person.role,
    })) as ProcessPersonAssignment[];
  }

  private async lookupScaffold(
    user: AuthUser,
    functionId: string,
    areaId: string,
  ): Promise<ScaffoldLookup> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const names = demoScaffoldNames(functionId, areaId);
      return names;
    }

    const [{ data: fn }, { data: area }] = await Promise.all([
      supabase
        .from("tenant_functions")
        .select("name")
        .eq("tenant_id", user.tenantId)
        .eq("id", functionId)
        .maybeSingle(),
      supabase
        .from("tenant_process_areas")
        .select("name")
        .eq("tenant_id", user.tenantId)
        .eq("id", areaId)
        .maybeSingle(),
    ]);

    return {
      functionName: fn?.name ?? "FUNC",
      areaName: area?.name ?? "AREA",
    };
  }

  private async nextSequenceNumber(
    tenantId: string,
    functionId: string,
    areaId: string,
  ) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return (
        this.demo.countProcessesInArea(tenantId, functionId, areaId) + 1
      );
    }

    const { count, error } = await supabase
      .from("processes")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("function_id", functionId)
      .eq("process_area_id", areaId);

    if (error) {
      throw new Error(error.message);
    }

    return (count ?? 0) + 1;
  }

  private async assertVersionAccess(
    user: AuthUser,
    processId: string,
    versionId: string,
    supabase = getSupabaseAdminClient(),
  ) {
    if (!supabase) {
      const process = this.demo.getProcess(user.tenantId, processId);
      if (!process || process.currentVersionId !== versionId) {
        throw new Error("Process version not found");
      }
      return;
    }

    const { data, error } = await supabase
      .from("process_versions")
      .select("id, process_id, tenant_id")
      .eq("id", versionId)
      .eq("process_id", processId)
      .eq("tenant_id", user.tenantId)
      .maybeSingle();

    if (error || !data) {
      throw new Error("Process version not found");
    }
  }

  private toListItem(process: {
    id: string;
    functionId: string;
    processAreaId: string;
    processCode?: string;
    name: string;
    description?: string;
    purpose?: string;
    status: string;
    riskRating: string;
    reviewFrequency: string;
    executionSchedule?: ExecutionSchedule;
    approvalRequired: boolean;
    tags: string[];
    functionName?: string;
    processAreaName?: string;
    createdAt: string;
    updatedAt: string;
  }) {
    return {
      id: process.id,
      functionId: process.functionId,
      processAreaId: process.processAreaId,
      processCode: process.processCode,
      name: process.name,
      description: process.description,
      purpose: process.purpose,
      status: process.status,
      riskRating: process.riskRating,
      reviewFrequency: process.reviewFrequency,
      executionSchedule: process.executionSchedule ?? { kind: "ad_hoc" },
      approvalRequired: process.approvalRequired,
      tags: process.tags,
      functionName: process.functionName,
      processAreaName: process.processAreaName,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
    };
  }

  private toDetail(process: {
    id: string;
    functionId: string;
    processAreaId: string;
    processCode?: string;
    name: string;
    description?: string;
    purpose?: string;
    whoItAffects: string[];
    linkedSystems: string[];
    linkedPolicies?: string;
    tags: string[];
    riskRating: string;
    riskNotes?: string;
    governanceControls: unknown[];
    approvalRequired: boolean;
    reviewFrequency: string;
    executionSchedule?: ExecutionSchedule;
    regulatoryReference?: string;
    status: string;
    functionName?: string;
    processAreaName?: string;
    createdAt: string;
    updatedAt: string;
  }) {
    return {
      id: process.id,
      functionId: process.functionId,
      processAreaId: process.processAreaId,
      processCode: process.processCode,
      name: process.name,
      description: process.description,
      purpose: process.purpose,
      whoItAffects: process.whoItAffects,
      linkedSystems: process.linkedSystems,
      linkedPolicies: process.linkedPolicies,
      tags: process.tags,
      riskRating: process.riskRating,
      riskNotes: process.riskNotes,
      governanceControls: process.governanceControls,
      approvalRequired: process.approvalRequired,
      reviewFrequency: process.reviewFrequency,
      executionSchedule: process.executionSchedule ?? { kind: "ad_hoc" },
      regulatoryReference: process.regulatoryReference,
      status: process.status,
      functionName: process.functionName,
      processAreaName: process.processAreaName,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
    };
  }

  private toStep(step: {
    id: string;
    stepNumber: number;
    title: string;
    description?: string;
    responsibleRole?: string;
    stepType: string;
    inputs?: string;
    outputs?: string;
    controls?: string;
    notes?: string;
    evidenceRequired: boolean;
  }) {
    return {
      id: step.id,
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      responsibleRole: step.responsibleRole,
      stepType: step.stepType,
      inputs: step.inputs,
      outputs: step.outputs,
      controls: step.controls,
      notes: step.notes,
      evidenceRequired: step.evidenceRequired,
    };
  }
}

function demoScaffoldNames(functionId: string, areaId: string): ScaffoldLookup {
  const lookup: Record<string, ScaffoldLookup> = {
    "fn-school-academics": { functionName: "Academics", areaName: "Student Records" },
    "fn-school-admissions": { functionName: "Admissions", areaName: "Enrolment" },
    "fn-school-finance": { functionName: "Finance", areaName: "Fees & Billing" },
  };

  const base = lookup[functionId] ?? { functionName: "FUNC", areaName: "AREA" };

  if (areaId.includes("student-records")) {
    return { functionName: "Academics", areaName: "Student Records" };
  }
  if (areaId.includes("enrolment")) {
    return { functionName: "Admissions", areaName: "Enrolment" };
  }
  if (areaId.includes("fees")) {
    return { functionName: "Finance", areaName: "Fees & Billing" };
  }

  return base;
}
