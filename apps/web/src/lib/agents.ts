export type AgentListItem = {
  id: string;
  agentCode: string;
  name: string;
  vendor?: string;
  modelName?: string;
  ownerId?: string;
  owningFunctionName?: string;
  riskClassification: "high" | "medium" | "low";
  status: string;
  lastAttestedAt?: string;
  nextAttestationDue?: string;
  attestationStatus: "current" | "due" | "overdue" | "unknown";
  linkedProcessCount: number;
};

export type LinkedAgent = {
  id: string;
  agentCode: string;
  name: string;
};

export type AgentAttestation = {
  id: string;
  attestedBy?: string;
  attestedAt: string;
  outcome: "confirmed" | "flagged" | "deprecation_recommended";
  notes?: string;
};

export type AgentDetail = AgentListItem & {
  description?: string;
  purpose?: string;
  modelVersion?: string;
  riskRationale?: string;
  deploymentEnvironment?: string;
  attestations: AgentAttestation[];
  linkedProcesses: Array<{
    processId: string;
    processName: string;
    processCode?: string;
    processStepId: string;
  }>;
};

export function riskBadgeClass(risk: string) {
  if (risk === "high") {
    return "bg-red-50 text-red-700";
  }
  if (risk === "low") {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-amber-50 text-amber-800";
}

export function attestationBadgeClass(status: string) {
  if (status === "overdue") {
    return "bg-red-50 text-red-700";
  }
  if (status === "due") {
    return "bg-amber-50 text-amber-800";
  }
  return "bg-slate-100 text-slate-700";
}

export function canManageAgents(permissions: string[]) {
  return (
    permissions.includes("*") ||
    permissions.includes("agents:create") ||
    permissions.includes("agents:edit")
  );
}
