export type AppRoute =
  | "/dashboard"
  | "/processes"
  | "/workflows"
  | "/agents"
  | "/audit"
  | "/audit-packs"
  | "/settings";

export type EmptyStateConfig = {
  title: string;
  description: string;
  actionLabel?: string;
};

export {
  LEGAL_DISCLAIMER,
  LEGAL_DISCLAIMER_FOOTER,
  FORBIDDEN_UI_TERMS,
  assertSafeLabel,
  findForbiddenTermsInText,
  type ForbiddenUiTerm,
} from "./legal";

export {
  ALIGNMENT_STATUS_VALUES,
  ALIGNMENT_STATUS_LABELS,
  GUIDANCE_SELECTION_VALUES,
  GUIDANCE_SELECTION_LABELS,
  type AlignmentStatus,
  type GuidanceSelectionStatus,
} from "./alignment-status";
