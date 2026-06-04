/** PRD / repository §9.1 — approved alignment and audit status values. */
export const ALIGNMENT_STATUS_VALUES = [
  "not_started",
  "in_progress",
  "evidence_missing",
  "owner_missing",
  "review_overdue",
  "acknowledgement_overdue",
  "action_required",
  "ready_for_internal_review",
  "ready_for_external_review_prep",
  "no_material_gaps",
] as const;

export type AlignmentStatus = (typeof ALIGNMENT_STATUS_VALUES)[number];

export const ALIGNMENT_STATUS_LABELS: Record<AlignmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  evidence_missing: "Evidence missing",
  owner_missing: "Owner missing",
  review_overdue: "Review overdue",
  acknowledgement_overdue: "Acknowledgement overdue",
  action_required: "Action required",
  ready_for_internal_review: "Ready for internal review",
  ready_for_external_review_prep: "Ready for external review preparation",
  no_material_gaps: "No material gaps found in selected checks",
};

/** Tenant guidance pack selection posture (Phase 14). */
export const GUIDANCE_SELECTION_VALUES = [
  "relevant",
  "certified",
  "working_towards",
  "align",
  "not_relevant",
  "deferred",
] as const;

export type GuidanceSelectionStatus = (typeof GUIDANCE_SELECTION_VALUES)[number];

/** Labels describe tenant posture toward a standard — not Aquilens certification. */
export const GUIDANCE_SELECTION_LABELS: Record<GuidanceSelectionStatus, string> = {
  relevant: "Relevant to our organisation",
  certified: "External certification in place",
  working_towards: "Working towards external certification",
  align: "Aligning to guidance",
  not_relevant: "Not relevant",
  deferred: "Deferred",
};
