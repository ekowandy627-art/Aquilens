import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { processDemoStore } from "../processes/process-demo.store";
import {
  agentDemoStore,
  type AgentRecord,
  type AttestationOutcome,
} from "./agent-demo.store";
import {
  attestationStatus,
  calculateNextAttestationDue,
  type RiskClassification,
} from "./attestation-schedule";
import { generateAgentCode, nextAgentSequence } from "./agent-code";

export class AgentError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_STATE"
      | "APPEND_ONLY"
      | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

type AgentFilters = {
  status?: string;
  risk?: string;
  vendor?: string;
  functionId?: string;
  attestationStatus?: string;
};

type CreateAgentInput = {
  name: string;
  description?: string;
  purpose?: string;
  vendor?: string;
  modelName?: string;
  modelVersion?: string;
  ownerId?: string;
  owningFunctionId?: string;
  riskClassification?: RiskClassification;
  riskRationale?: string;
  deploymentEnvironment?: string;
  version?: string;
  deploymentDate?: string;
};

type AttestInput = {
  outcome: AttestationOutcome;
  notes?: string;
};

@Injectable()
export class AgentsService {
  async list(user: AuthUser, filters: AgentFilters = {}) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return this.listDemo(user.tenantId, filters);
    }
    return this.listFromDb(user.tenantId, filters, supabase);
  }

  async get(user: AuthUser, idOrCode: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return this.getDemoDetail(user.tenantId, idOrCode);
    }
    return this.getFromDb(user.tenantId, idOrCode, supabase);
  }

  async create(user: AuthUser, input: CreateAgentInput) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const now = new Date().toISOString();
      const risk = input.riskClassification ?? "medium";
      const agent = agentDemoStore.createAgent(user.tenantId, {
        name: input.name,
        description: input.description,
        purpose: input.purpose,
        vendor: input.vendor,
        modelName: input.modelName,
        modelVersion: input.modelVersion,
        ownerId: input.ownerId ?? user.id,
        owningFunctionId: input.owningFunctionId,
        riskClassification: risk,
        riskRationale: input.riskRationale,
        deploymentEnvironment: input.deploymentEnvironment,
        version: input.version,
        deploymentDate: input.deploymentDate,
        lastAttestedAt: now,
        nextAttestationDue: calculateNextAttestationDue(now, risk),
        createdBy: user.id,
      });
      return this.toAgentSummary(agent);
    }

    return await this.createInDb(user, input, supabase);
  }

  async update(user: AuthUser, idOrCode: string, patch: Partial<CreateAgentInput>) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const updated = agentDemoStore.updateAgent(user.tenantId, idOrCode, {
        name: patch.name,
        description: patch.description,
        purpose: patch.purpose,
        vendor: patch.vendor,
        modelName: patch.modelName,
        modelVersion: patch.modelVersion,
        ownerId: patch.ownerId,
        owningFunctionId: patch.owningFunctionId,
        riskClassification: patch.riskClassification,
        riskRationale: patch.riskRationale,
        deploymentEnvironment: patch.deploymentEnvironment,
        version: patch.version,
        deploymentDate: patch.deploymentDate,
      });
      if (!updated) {
        throw new AgentError("NOT_FOUND", "Agent not found.");
      }
      return this.toAgentSummary(updated);
    }

    return await this.updateInDb(user.tenantId, idOrCode, patch, supabase);
  }

  async deprecate(user: AuthUser, idOrCode: string) {
    const detail = await this.get(user, idOrCode);
    if (!detail) {
      throw new AgentError("NOT_FOUND", "Agent not found.");
    }
    const linkedProcesses = detail.linkedProcessCount;
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const updated = agentDemoStore.updateAgent(user.tenantId, detail.id, {
        status: "deprecated",
      });
      return {
        agent: this.toAgentSummary(updated!),
        impact: { linkedProcessCount: linkedProcesses },
      };
    }

    return this.setStatusInDb(
      user.tenantId,
      detail.id,
      "deprecated",
      linkedProcesses,
      supabase,
    );
  }

  async retire(user: AuthUser, idOrCode: string) {
    const detail = await this.get(user, idOrCode);
    if (!detail) {
      throw new AgentError("NOT_FOUND", "Agent not found.");
    }
    if (detail.status !== "deprecated") {
      throw new AgentError(
        "INVALID_STATE",
        "Only deprecated agents can be retired.",
      );
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const updated = agentDemoStore.updateAgent(user.tenantId, detail.id, {
        status: "retired",
      });
      return this.toAgentSummary(updated!);
    }

    const result = await this.setStatusInDb(
      user.tenantId,
      detail.id,
      "retired",
      0,
      supabase,
    );
    return "agent" in result ? result.agent : result;
  }

  async listProcesses(user: AuthUser, idOrCode: string) {
    const agent = this.requireAgent(user.tenantId, idOrCode);
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return agentDemoStore.listStepLinksForAgent(user.tenantId, agent.id).map(
        (link) => ({
          processId: link.processId,
          processName: link.processName,
          processCode: link.processCode,
          processStepId: link.processStepId,
        }),
      );
    }

    return this.listProcessesFromDb(user.tenantId, agent.id, supabase);
  }

  async listAttestations(user: AuthUser, idOrCode: string) {
    const agent = this.requireAgent(user.tenantId, idOrCode);
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return agentDemoStore
        .listAttestations(user.tenantId, agent.id)
        .map((item) => this.toAttestation(item));
    }

    return this.listAttestationsFromDb(user.tenantId, agent.id, supabase);
  }

  async attest(user: AuthUser, idOrCode: string, input: AttestInput) {
    const agent = this.requireAgent(user.tenantId, idOrCode);
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const result = agentDemoStore.appendAttestation(user.tenantId, agent.id, {
        attestedBy: user.id,
        outcome: input.outcome,
        notes: input.notes,
      });
      if (!result) {
        throw new AgentError("NOT_FOUND", "Agent not found.");
      }
      return {
        agent: this.toAgentSummary(result.agent),
        attestation: this.toAttestation(result.attestation),
      };
    }

    return this.attestInDb(user, agent.id, input, supabase);
  }

  async listDueAttestation(user: AuthUser) {
    const items = await this.list(user, {});
    return items.filter(
      (item) =>
        item.attestationStatus === "due" || item.attestationStatus === "overdue",
    );
  }

  async linkToStep(
    user: AuthUser,
    processId: string,
    versionId: string,
    stepId: string,
    agentId: string,
  ) {
    this.assertStepInVersion(user.tenantId, processId, versionId, stepId);
    const agent = this.requireAgent(user.tenantId, agentId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const process = processDemoStore.getProcess(user.tenantId, processId);
      if (!process) {
        throw new AgentError("NOT_FOUND", "Process not found.");
      }
      const link = agentDemoStore.linkAgentToStep({
        processStepId: stepId,
        agentId: agent.id,
        tenantId: user.tenantId,
        processId,
        processName: process.name,
        processCode: process.processCode,
        linkedBy: user.id,
      });
      if (!link) {
        throw new AgentError("NOT_FOUND", "Agent not found.");
      }
      return {
        processStepId: stepId,
        agent: this.toLinkedAgent(agent),
      };
    }

    return this.linkInDb(user, stepId, agent.id, supabase);
  }

  async unlinkFromStep(
    user: AuthUser,
    processId: string,
    versionId: string,
    stepId: string,
    agentId: string,
  ) {
    this.assertStepInVersion(user.tenantId, processId, versionId, stepId);
    const agent = this.requireAgent(user.tenantId, agentId);

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      const removed = agentDemoStore.unlinkAgentFromStep(
        user.tenantId,
        stepId,
        agent.id,
      );
      if (!removed) {
        throw new AgentError("NOT_FOUND", "Agent link not found.");
      }
      return { processStepId: stepId, agentId: agent.id };
    }

    return this.unlinkInDb(user.tenantId, stepId, agent.id, supabase);
  }

  async agentsForStep(tenantId: string, processStepId: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return agentDemoStore
        .listAgentsForStep(tenantId, processStepId)
        .map((agent) => this.toLinkedAgent(agent));
    }
    return this.agentsForStepFromDb(tenantId, processStepId, supabase);
  }

  async search(user: AuthUser, query: string) {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return agentDemoStore
        .semanticSearch(user.tenantId, query)
        .map((agent) => this.toAgentSummary(agent));
    }

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const pattern = terms.map((term) => `%${term}%`).join("");
    return supabase
      .from("ai_agents")
      .select("*")
      .eq("tenant_id", user.tenantId)
      .or(
        `name.ilike.${pattern},description.ilike.${pattern},purpose.ilike.${pattern}`,
      )
      .limit(10)
      .then(({ data, error }) => {
        if (error) {
          throw new Error(error.message);
        }
        return (data ?? []).map((row) => this.toAgentSummaryFromRow(row));
      });
  }

  private listDemo(tenantId: string, filters: AgentFilters) {
    return agentDemoStore
      .listAgents(tenantId)
      .filter((agent) => this.matchesFilters(agent, filters))
      .map((agent) => this.toAgentSummary(agent));
  }

  private getDemoDetail(tenantId: string, idOrCode: string) {
    const agent = agentDemoStore.getAgent(tenantId, idOrCode);
    if (!agent) {
      return null;
    }
    const attestations = agentDemoStore.listAttestations(tenantId, agent.id);
    const linkedProcesses = agentDemoStore.listStepLinksForAgent(
      tenantId,
      agent.id,
    );
    return {
      ...this.toAgentSummary(agent),
      attestations: attestations.map((item) => this.toAttestation(item)),
      linkedProcesses: linkedProcesses.map((link) => ({
        processId: link.processId,
        processName: link.processName,
        processCode: link.processCode,
        processStepId: link.processStepId,
      })),
      linkedProcessCount: linkedProcesses.length,
    };
  }

  private requireAgent(tenantId: string, idOrCode: string) {
    const agent = agentDemoStore.getAgent(tenantId, idOrCode);
    if (!agent) {
      throw new AgentError("NOT_FOUND", "Agent not found.");
    }
    return agent;
  }

  private matchesFilters(agent: AgentRecord, filters: AgentFilters) {
    if (filters.status && agent.status !== filters.status) {
      return false;
    }
    if (filters.risk && agent.riskClassification !== filters.risk) {
      return false;
    }
    if (filters.vendor && agent.vendor !== filters.vendor) {
      return false;
    }
    if (filters.functionId && agent.owningFunctionId !== filters.functionId) {
      return false;
    }
    if (filters.attestationStatus) {
      const status = attestationStatus(agent.nextAttestationDue);
      if (status !== filters.attestationStatus) {
        return false;
      }
    }
    return true;
  }

  private assertStepInVersion(
    tenantId: string,
    processId: string,
    versionId: string,
    stepId: string,
  ) {
    const process = processDemoStore.getProcess(tenantId, processId);
    if (!process || process.currentVersionId !== versionId) {
      throw new AgentError("NOT_FOUND", "Process version not found.");
    }
    const step = processDemoStore.listSteps(versionId).find((item) => item.id === stepId);
    if (!step) {
      throw new AgentError("NOT_FOUND", "Process step not found.");
    }
  }

  private toAgentSummary(agent: AgentRecord) {
    return {
      id: agent.id,
      agentCode: agent.agentCode,
      name: agent.name,
      description: agent.description,
      purpose: agent.purpose,
      vendor: agent.vendor,
      modelName: agent.modelName,
      modelVersion: agent.modelVersion,
      ownerId: agent.ownerId,
      owningFunctionId: agent.owningFunctionId,
      owningFunctionName: agent.owningFunctionName,
      riskClassification: agent.riskClassification,
      status: agent.status,
      lastAttestedAt: agent.lastAttestedAt,
      nextAttestationDue: agent.nextAttestationDue,
      attestationStatus: attestationStatus(agent.nextAttestationDue),
      linkedProcessCount: agentDemoStore.linkedProcessCount(
        agent.tenantId,
        agent.id,
      ),
      createdAt: agent.createdAt,
    };
  }

  private toLinkedAgent(agent: AgentRecord) {
    return {
      id: agent.id,
      agentCode: agent.agentCode,
      name: agent.name,
    };
  }

  private toAttestation(item: {
    id: string;
    attestedBy?: string;
    attestedAt: string;
    outcome: AttestationOutcome;
    notes?: string;
  }) {
    return {
      id: item.id,
      attestedBy: item.attestedBy,
      attestedAt: item.attestedAt,
      outcome: item.outcome,
      notes: item.notes,
    };
  }

  private async listFromDb(
    tenantId: string,
    filters: AgentFilters,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    let query = supabase.from("ai_agents").select("*").eq("tenant_id", tenantId);
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.risk) {
      query = query.eq("risk_classification", filters.risk);
    }
    if (filters.vendor) {
      query = query.eq("vendor", filters.vendor);
    }
    if (filters.functionId) {
      query = query.eq("owning_function_id", filters.functionId);
    }
    const { data, error } = await query.order("agent_code");
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => this.toAgentSummaryFromRow(row));
  }

  private async getFromDb(
    tenantId: string,
    idOrCode: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data, error } = await supabase
      .from("ai_agents")
      .select("*")
      .eq("tenant_id", tenantId)
      .or(`id.eq.${idOrCode},agent_code.eq.${idOrCode}`)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return null;
    }
    const [attestations, links] = await Promise.all([
      this.listAttestationsFromDb(tenantId, data.id as string, supabase),
      this.listProcessesFromDb(tenantId, data.id as string, supabase),
    ]);
    const summary = this.toAgentSummaryFromRow(data);
    return {
      ...summary,
      attestations,
      linkedProcesses: links,
      linkedProcessCount: links.length,
    };
  }

  private async createInDb(
    user: AuthUser,
    input: CreateAgentInput,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data: existing } = await supabase
      .from("ai_agents")
      .select("agent_code")
      .eq("tenant_id", user.tenantId);
    const agentCode = generateAgentCode(
      nextAgentSequence((existing ?? []).map((row) => row.agent_code as string)),
    );
    const now = new Date().toISOString();
    const risk = input.riskClassification ?? "medium";
    const id = randomUUID();
    const { data, error } = await supabase
      .from("ai_agents")
      .insert({
        id,
        tenant_id: user.tenantId,
        agent_code: agentCode,
        name: input.name,
        description: input.description ?? null,
        purpose: input.purpose ?? null,
        vendor: input.vendor ?? null,
        model_name: input.modelName ?? null,
        model_version: input.modelVersion ?? null,
        owner_id: input.ownerId ?? user.id,
        owning_function_id: input.owningFunctionId ?? null,
        risk_classification: risk,
        risk_rationale: input.riskRationale ?? null,
        deployment_environment: input.deploymentEnvironment ?? null,
        version: input.version ?? null,
        deployment_date: input.deploymentDate ?? null,
        last_attested_at: now,
        next_attestation_due: calculateNextAttestationDue(now, risk),
        created_by: user.id,
      })
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return this.toAgentSummaryFromRow(data);
  }

  private async updateInDb(
    tenantId: string,
    idOrCode: string,
    patch: Partial<CreateAgentInput>,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const existing = await this.getFromDb(tenantId, idOrCode, supabase);
    if (!existing) {
      throw new AgentError("NOT_FOUND", "Agent not found.");
    }
    const { data, error } = await supabase
      .from("ai_agents")
      .update({
        name: patch.name,
        description: patch.description,
        purpose: patch.purpose,
        vendor: patch.vendor,
        model_name: patch.modelName,
        model_version: patch.modelVersion,
        owner_id: patch.ownerId,
        owning_function_id: patch.owningFunctionId,
        risk_classification: patch.riskClassification,
        risk_rationale: patch.riskRationale,
        deployment_environment: patch.deploymentEnvironment,
        version: patch.version,
        deployment_date: patch.deploymentDate,
      })
      .eq("tenant_id", tenantId)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return this.toAgentSummaryFromRow(data);
  }

  private async setStatusInDb(
    tenantId: string,
    agentId: string,
    status: string,
    linkedProcessCount: number,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data, error } = await supabase
      .from("ai_agents")
      .update({ status })
      .eq("tenant_id", tenantId)
      .eq("id", agentId)
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    if (status === "deprecated") {
      return {
        agent: this.toAgentSummaryFromRow(data),
        impact: { linkedProcessCount },
      };
    }
    return this.toAgentSummaryFromRow(data);
  }

  private async listAttestationsFromDb(
    tenantId: string,
    agentId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data, error } = await supabase
      .from("agent_attestations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("agent_id", agentId)
      .order("attested_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => ({
      id: row.id as string,
      attestedBy: (row.attested_by as string) ?? undefined,
      attestedAt: row.attested_at as string,
      outcome: row.outcome as AttestationOutcome,
      notes: (row.notes as string) ?? undefined,
    }));
  }

  private async listProcessesFromDb(
    tenantId: string,
    agentId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data, error } = await supabase
      .from("process_step_agents")
      .select("process_step_id, process_steps(process_version_id, process_versions(process_id, processes(name, process_code)))")
      .eq("tenant_id", tenantId)
      .eq("agent_id", agentId);
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => {
      const steps = row.process_steps as {
        process_versions?: {
          process_id?: string;
          processes?: { name?: string; process_code?: string };
        };
      } | null;
      const process = steps?.process_versions?.processes;
      return {
        processId: steps?.process_versions?.process_id as string,
        processName: process?.name ?? "Process",
        processCode: process?.process_code ?? undefined,
        processStepId: row.process_step_id as string,
      };
    });
  }

  private async attestInDb(
    user: AuthUser,
    agentId: string,
    input: AttestInput,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const now = new Date().toISOString();
    const { data: agentRow } = await supabase
      .from("ai_agents")
      .select("risk_classification")
      .eq("tenant_id", user.tenantId)
      .eq("id", agentId)
      .maybeSingle();
    if (!agentRow) {
      throw new AgentError("NOT_FOUND", "Agent not found.");
    }

    const { data: attestation, error: attestationError } = await supabase
      .from("agent_attestations")
      .insert({
        tenant_id: user.tenantId,
        agent_id: agentId,
        attested_by: user.id,
        attested_at: now,
        outcome: input.outcome,
        notes: input.notes ?? null,
      })
      .select("*")
      .single();
    if (attestationError) {
      throw new Error(attestationError.message);
    }

    const risk = agentRow.risk_classification as RiskClassification;
    const { data: updated, error } = await supabase
      .from("ai_agents")
      .update({
        last_attested_at: now,
        next_attestation_due: calculateNextAttestationDue(now, risk),
      })
      .eq("id", agentId)
      .select("*")
      .single();
    if (error) {
      throw new Error(error.message);
    }

    return {
      agent: this.toAgentSummaryFromRow(updated),
      attestation: {
        id: attestation.id as string,
        attestedBy: user.id,
        attestedAt: now,
        outcome: input.outcome,
        notes: input.notes,
      },
    };
  }

  private async linkInDb(
    user: AuthUser,
    stepId: string,
    agentId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { error } = await supabase.from("process_step_agents").insert({
      process_step_id: stepId,
      agent_id: agentId,
      tenant_id: user.tenantId,
      linked_by: user.id,
    });
    if (error) {
      throw new Error(error.message);
    }
    const { data } = await supabase
      .from("ai_agents")
      .select("id, agent_code, name")
      .eq("id", agentId)
      .maybeSingle();
    return {
      processStepId: stepId,
      agent: {
        id: data?.id,
        agentCode: data?.agent_code,
        name: data?.name,
      },
    };
  }

  private async unlinkInDb(
    tenantId: string,
    stepId: string,
    agentId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { error } = await supabase
      .from("process_step_agents")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("process_step_id", stepId)
      .eq("agent_id", agentId);
    if (error) {
      throw new Error(error.message);
    }
    return { processStepId: stepId, agentId };
  }

  private async agentsForStepFromDb(
    tenantId: string,
    processStepId: string,
    supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  ) {
    const { data, error } = await supabase
      .from("process_step_agents")
      .select("ai_agents(id, agent_code, name)")
      .eq("tenant_id", tenantId)
      .eq("process_step_id", processStepId);
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map((row) => {
      const agent = row.ai_agents as { id: string; agent_code: string; name: string };
      return {
        id: agent.id,
        agentCode: agent.agent_code,
        name: agent.name,
      };
    });
  }

  private toAgentSummaryFromRow(row: Record<string, unknown>) {
    const nextDue = (row.next_attestation_due as string) ?? undefined;
    return {
      id: row.id as string,
      agentCode: row.agent_code as string,
      name: row.name as string,
      description: (row.description as string) ?? undefined,
      purpose: (row.purpose as string) ?? undefined,
      vendor: (row.vendor as string) ?? undefined,
      modelName: (row.model_name as string) ?? undefined,
      modelVersion: (row.model_version as string) ?? undefined,
      ownerId: (row.owner_id as string) ?? undefined,
      owningFunctionId: (row.owning_function_id as string) ?? undefined,
      riskClassification: row.risk_classification as RiskClassification,
      status: row.status as string,
      lastAttestedAt: (row.last_attested_at as string) ?? undefined,
      nextAttestationDue: nextDue,
      attestationStatus: attestationStatus(nextDue),
      linkedProcessCount: 0,
      createdAt: row.created_at as string,
    };
  }
}
