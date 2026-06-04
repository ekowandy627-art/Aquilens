export type GovernanceControl = {
  name: string;
  type: "preventive" | "detective" | "corrective";
  owner: string;
};

export type GeneratedStep = {
  step_number: number;
  title: string;
  description: string;
  responsible_role: string;
  inputs: string;
  outputs: string;
  controls: string;
  step_type: "manual" | "approval";
  evidence_required: boolean;
};

export type SopGap = {
  field: string;
  severity: "required" | "recommended";
  message: string;
};

export type GeneratedSopDraft = {
  name: string;
  description: string;
  purpose: string;
  risk_rating: "high" | "medium" | "low";
  risk_notes: string;
  who_it_affects: string[];
  governance_controls: GovernanceControl[];
  steps: GeneratedStep[];
  gaps: SopGap[];
};

export type GenerateSopInput = {
  description: string;
  functionId: string;
  processAreaId: string;
  tenantContext?: string;
  tenantId?: string;
  actorUserId?: string;
};

export type GenerateSopResult = {
  draft: GeneratedSopDraft;
  gaps: SopGap[];
  model: string;
  tokensUsed: number;
};

export function normalizeGeneratedDraft(raw: unknown): GeneratedSopDraft {
  const value = raw as Partial<GeneratedSopDraft>;
  const steps = Array.isArray(value.steps)
    ? value.steps.map((step, index) => ({
        step_number: step.step_number ?? index + 1,
        title: step.title ?? `Step ${index + 1}`,
        description: step.description ?? "",
        responsible_role: step.responsible_role ?? "",
        inputs: step.inputs ?? "",
        outputs: step.outputs ?? "",
        controls: step.controls ?? "",
        step_type: step.step_type === "approval" ? "approval" as const : "manual" as const,
        evidence_required: Boolean(step.evidence_required),
      }))
    : [];

  const gaps = Array.isArray(value.gaps) ? value.gaps : [];

  return {
    name: value.name?.trim() || "Untitled process",
    description: value.description?.trim() || "",
    purpose: value.purpose?.trim() || value.description?.trim() || "",
    risk_rating:
      value.risk_rating === "high" || value.risk_rating === "low"
        ? value.risk_rating
        : "medium",
    risk_notes: value.risk_notes?.trim() || "",
    who_it_affects: Array.isArray(value.who_it_affects)
      ? value.who_it_affects.filter(Boolean)
      : [],
    governance_controls: Array.isArray(value.governance_controls)
      ? value.governance_controls
      : [],
    steps,
    gaps,
  };
}

export function mergeGaps(draft: GeneratedSopDraft): SopGap[] {
  const derived: SopGap[] = [];

  if (!draft.governance_controls.length) {
    derived.push({
      field: "governance_controls",
      severity: "recommended",
      message:
        "No governance controls defined — consider adding at least one preventive control",
    });
  }

  draft.steps.forEach((step) => {
    if (!step.outputs?.trim()) {
      derived.push({
        field: `steps.${step.step_number}.outputs`,
        severity: "recommended",
        message: `Step ${step.step_number} has no defined outputs — what does this step produce?`,
      });
    }
  });

  const seen = new Set<string>();
  return [...draft.gaps, ...derived].filter((gap) => {
    const key = `${gap.field}:${gap.severity}:${gap.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function buildMockDraft(input: GenerateSopInput): GeneratedSopDraft {
  const title =
    input.description.split(/[.!?]/)[0]?.trim().slice(0, 80) ||
    "Generated process";

  const draft: GeneratedSopDraft = {
    name: title.charAt(0).toUpperCase() + title.slice(1),
    description: input.description.trim(),
    purpose: `Ensure ${title.toLowerCase()} is completed consistently and safely.`,
    risk_rating: /safeguard|incident|emergency|finance|fee/i.test(
      input.description,
    )
      ? "high"
      : "medium",
    risk_notes:
      "Review the AI-generated risk rating before submitting this SOP for approval.",
    who_it_affects: ["Staff", "Department Head"],
    governance_controls: [],
    steps: [
      {
        step_number: 1,
        title: "Receive and log request",
        description: "Capture the initial request or trigger event.",
        responsible_role: "Process Owner",
        inputs: "Request details",
        outputs: "Logged case record",
        controls: "Use the standard intake form",
        step_type: "manual",
        evidence_required: false,
      },
      {
        step_number: 2,
        title: "Review and assess",
        description: "Assess the situation against policy and escalate if needed.",
        responsible_role: "Department Head",
        inputs: "Logged case record",
        outputs: "",
        controls: "Follow escalation matrix",
        step_type: "approval",
        evidence_required: true,
      },
      {
        step_number: 3,
        title: "Complete and record outcome",
        description: "Execute the required actions and record the outcome.",
        responsible_role: "Staff",
        inputs: "Approved action plan",
        outputs: "Completed record in system",
        controls: "Update audit trail",
        step_type: "manual",
        evidence_required: true,
      },
    ],
    gaps: [
      {
        field: "owner",
        severity: "required",
        message: "Owner not assigned — assign a Process Owner before publishing",
      },
      {
        field: "risk_rating",
        severity: "required",
        message: "Risk rating is set to Medium — review and confirm this is correct",
      },
    ],
  };

  return draft;
}
