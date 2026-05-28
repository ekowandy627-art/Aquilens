import { randomUUID } from "crypto";
import {
  calculateNextAttestationDue,
  type RiskClassification,
} from "./attestation-schedule";
import { generateAgentCode, nextAgentSequence } from "./agent-code";

export type AgentStatus = "active" | "under_review" | "deprecated" | "retired";
export type AttestationOutcome = "confirmed" | "flagged" | "deprecation_recommended";

export type AgentRecord = {
  id: string;
  tenantId: string;
  agentCode: string;
  name: string;
  description?: string;
  purpose?: string;
  vendor?: string;
  modelName?: string;
  modelVersion?: string;
  ownerId?: string;
  owningFunctionId?: string;
  owningFunctionName?: string;
  riskClassification: RiskClassification;
  riskRationale?: string;
  deploymentEnvironment?: string;
  status: AgentStatus;
  version?: string;
  deploymentDate?: string;
  lastAttestedAt?: string;
  nextAttestationDue?: string;
  createdBy?: string;
  createdAt: string;
  searchContent?: string;
};

export type AgentAttestationRecord = {
  id: string;
  tenantId: string;
  agentId: string;
  attestedBy?: string;
  attestedAt: string;
  outcome: AttestationOutcome;
  notes?: string;
};

export type ProcessStepAgentRecord = {
  processStepId: string;
  agentId: string;
  tenantId: string;
  processId: string;
  processName: string;
  processCode?: string;
  linkedBy?: string;
  linkedAt: string;
};

const agents = new Map<string, AgentRecord>();
const attestations = new Map<string, AgentAttestationRecord>();
const stepLinks = new Map<string, ProcessStepAgentRecord>();

function linkKey(processStepId: string, agentId: string) {
  return `${processStepId}:${agentId}`;
}

function buildSearchContent(agent: Pick<AgentRecord, "name" | "description" | "purpose">) {
  return [agent.name, agent.description, agent.purpose].filter(Boolean).join(" ").toLowerCase();
}

function seedAgent(
  input: Omit<AgentRecord, "id" | "createdAt" | "searchContent"> & { id?: string },
) {
  const id = input.id ?? randomUUID();
  const record: AgentRecord = {
    ...input,
    id,
    createdAt: input.lastAttestedAt ?? "2026-05-26T10:00:00.000Z",
    searchContent: buildSearchContent(input),
  };
  agents.set(id, record);
  return record;
}

function seedAttestation(
  input: Omit<AgentAttestationRecord, "id"> & { id?: string },
) {
  const id = input.id ?? randomUUID();
  const record = { ...input, id };
  attestations.set(id, record);
  return record;
}

function seedStepLink(input: Omit<ProcessStepAgentRecord, "linkedAt"> & { linkedAt?: string }) {
  const record: ProcessStepAgentRecord = {
    ...input,
    linkedAt: input.linkedAt ?? "2026-05-26T10:00:00.000Z",
  };
  stepLinks.set(linkKey(input.processStepId, input.agentId), record);
  return record;
}

function buildInitialStore() {
  const sixMonthsAgo = "2025-11-28T10:00:00.000Z";
  const twoMonthsAgo = "2026-03-28T10:00:00.000Z";
  const overdueDue = "2026-05-01T10:00:00.000Z";

  const agent1 = seedAgent({
    id: "agent-gis-001",
    tenantId: "tenant-gis",
    agentCode: "AI-001",
    name: "Attendance Pattern Analyser",
    description: "Flags unusual attendance patterns for admin review.",
    purpose: "Analyse daily attendance registers for anomalies.",
    vendor: "Anthropic",
    modelName: "claude-sonnet-4-6",
    ownerId: "user-gis-owner",
    owningFunctionId: "fn-school-academics",
    owningFunctionName: "Academics",
    riskClassification: "medium",
    riskRationale: "Processes student attendance data.",
    deploymentEnvironment: "production",
    status: "active",
    lastAttestedAt: sixMonthsAgo,
    nextAttestationDue: overdueDue,
    createdBy: "user-gis-admin",
  });

  const agent2 = seedAgent({
    id: "agent-gis-002",
    tenantId: "tenant-gis",
    agentCode: "AI-002",
    name: "Application Scoring Assistant",
    description: "Supports admissions officers with structured application scoring.",
    purpose: "Score enrolment applications against rubric criteria.",
    vendor: "OpenAI",
    modelName: "gpt-4o",
    ownerId: "user-gis-head",
    owningFunctionId: "fn-school-admissions",
    owningFunctionName: "Admissions",
    riskClassification: "high",
    riskRationale: "Influences admissions decisions on applicant data.",
    deploymentEnvironment: "production",
    status: "active",
    lastAttestedAt: twoMonthsAgo,
    nextAttestationDue: calculateNextAttestationDue(twoMonthsAgo, "high"),
    createdBy: "user-gis-admin",
  });

  seedAttestation({
    id: "attest-gis-001-1",
    tenantId: "tenant-gis",
    agentId: agent1.id,
    attestedBy: "user-gis-compliance",
    attestedAt: sixMonthsAgo,
    outcome: "confirmed",
    notes: "Initial governance review complete.",
  });

  seedAttestation({
    id: "attest-gis-002-1",
    tenantId: "tenant-gis",
    agentId: agent2.id,
    attestedBy: "user-gis-compliance",
    attestedAt: "2026-01-28T10:00:00.000Z",
    outcome: "confirmed",
    notes: "Quarterly review — no issues.",
  });

  seedAttestation({
    id: "attest-gis-002-2",
    tenantId: "tenant-gis",
    agentId: agent2.id,
    attestedBy: "user-gis-compliance",
    attestedAt: twoMonthsAgo,
    outcome: "confirmed",
    notes: "High-risk agent re-attested after model update.",
  });

  seedStepLink({
    processStepId: "proc-gis-attendance-v1-step-2",
    agentId: agent1.id,
    tenantId: "tenant-gis",
    processId: "proc-gis-attendance",
    processName: "Record Student Attendance",
    processCode: "ACAD-STUD-001",
    linkedBy: "user-gis-owner",
  });

  seedStepLink({
    processStepId: "proc-gis-enrolment-v3-step-3",
    agentId: agent2.id,
    tenantId: "tenant-gis",
    processId: "proc-gis-enrolment",
    processName: "Enrol New Student",
    processCode: "ADMN-ENR-001",
    linkedBy: "user-gis-owner",
  });

  return { agents, attestations, stepLinks };
}

let store = buildInitialStore();

export class AgentDemoStore {
  listAgents(tenantId: string) {
    return [...store.agents.values()]
      .filter((agent) => agent.tenantId === tenantId)
      .sort((a, b) => a.agentCode.localeCompare(b.agentCode));
  }

  getAgent(tenantId: string, idOrCode: string) {
    return (
      [...store.agents.values()].find(
        (agent) =>
          agent.tenantId === tenantId &&
          (agent.id === idOrCode || agent.agentCode === idOrCode),
      ) ?? null
    );
  }

  createAgent(
    tenantId: string,
    input: Omit<
      AgentRecord,
      "id" | "tenantId" | "agentCode" | "createdAt" | "searchContent" | "status"
    > & { status?: AgentStatus },
  ) {
    const codes = this.listAgents(tenantId).map((agent) => agent.agentCode);
    const agentCode = generateAgentCode(nextAgentSequence(codes));
    const now = new Date().toISOString();
    const lastAttestedAt = input.lastAttestedAt;
    const nextAttestationDue =
      input.nextAttestationDue ??
      (lastAttestedAt
        ? calculateNextAttestationDue(lastAttestedAt, input.riskClassification)
        : calculateNextAttestationDue(now, input.riskClassification));

    const record = seedAgent({
      ...input,
      tenantId,
      agentCode,
      status: input.status ?? "active",
      lastAttestedAt,
      nextAttestationDue,
    });
    return record;
  }

  updateAgent(tenantId: string, idOrCode: string, patch: Partial<AgentRecord>) {
    const existing = this.getAgent(tenantId, idOrCode);
    if (!existing) {
      return null;
    }
    const updated: AgentRecord = {
      ...existing,
      ...patch,
      id: existing.id,
      tenantId: existing.tenantId,
      agentCode: existing.agentCode,
      searchContent: buildSearchContent({ ...existing, ...patch }),
    };
    if (patch.riskClassification && updated.lastAttestedAt) {
      updated.nextAttestationDue = calculateNextAttestationDue(
        updated.lastAttestedAt,
        updated.riskClassification,
      );
    }
    store.agents.set(existing.id, updated);
    return updated;
  }

  listAttestations(tenantId: string, agentId: string) {
    return [...store.attestations.values()]
      .filter((item) => item.tenantId === tenantId && item.agentId === agentId)
      .sort((a, b) => b.attestedAt.localeCompare(a.attestedAt));
  }

  appendAttestation(
    tenantId: string,
    agentId: string,
    input: {
      attestedBy?: string;
      outcome: AttestationOutcome;
      notes?: string;
      attestedAt?: string;
    },
  ) {
    const agent = this.getAgent(tenantId, agentId);
    if (!agent) {
      return null;
    }
    const attestedAt = input.attestedAt ?? new Date().toISOString();
    const record = seedAttestation({
      tenantId,
      agentId: agent.id,
      attestedBy: input.attestedBy,
      attestedAt,
      outcome: input.outcome,
      notes: input.notes,
    });
    const updated = this.updateAgent(tenantId, agent.id, {
      lastAttestedAt: attestedAt,
      nextAttestationDue: calculateNextAttestationDue(
        attestedAt,
        agent.riskClassification,
      ),
    });
    return { attestation: record, agent: updated! };
  }

  listStepLinksForAgent(tenantId: string, agentId: string) {
    return [...store.stepLinks.values()].filter(
      (link) => link.tenantId === tenantId && link.agentId === agentId,
    );
  }

  listAgentsForStep(tenantId: string, processStepId: string) {
    const agentIds = [...store.stepLinks.values()]
      .filter((link) => link.tenantId === tenantId && link.processStepId === processStepId)
      .map((link) => link.agentId);
    return agentIds
      .map((agentId) => store.agents.get(agentId))
      .filter((agent): agent is AgentRecord => Boolean(agent));
  }

  linkAgentToStep(input: Omit<ProcessStepAgentRecord, "linkedAt">) {
    const agent = store.agents.get(input.agentId);
    if (!agent || agent.tenantId !== input.tenantId) {
      return null;
    }
    return seedStepLink(input);
  }

  unlinkAgentFromStep(tenantId: string, processStepId: string, agentId: string) {
    const key = linkKey(processStepId, agentId);
    const existing = store.stepLinks.get(key);
    if (!existing || existing.tenantId !== tenantId) {
      return false;
    }
    store.stepLinks.delete(key);
    return true;
  }

  linkedProcessCount(tenantId: string, agentId: string) {
    return this.listStepLinksForAgent(tenantId, agentId).length;
  }

  semanticSearch(tenantId: string, query: string, limit = 10) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = this.listAgents(tenantId).map((agent) => {
      const content = agent.searchContent ?? buildSearchContent(agent);
      const score = terms.reduce(
        (total, term) => total + (content.includes(term) ? 1 : 0),
        0,
      );
      return { agent, score };
    });
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.agent);
  }
}

export const agentDemoStore = new AgentDemoStore();

export function resetAgentDemoStore() {
  store = buildInitialStore();
}
