export const WORKFLOW_TRIGGERS = [
  "sop_submitted_for_approval",
  "compliance_execution",
  "incident_logged",
  "siai_created",
  "agent_attestation_due",
] as const;

export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGERS)[number];

export type WorkflowTriggerContext = {
  processId?: string;
  processVersionId?: string;
  processName?: string;
  approvalId?: string;
  approverId?: string;
  incidentId?: string;
  siaiId?: string;
  assigneeId?: string;
  signOffAssigneeId?: string;
  raiserId?: string;
  agentId?: string;
  agentName?: string;
};
