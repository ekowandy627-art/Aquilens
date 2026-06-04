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

export {
  JURISDICTION_TAXONOMY,
  JURISDICTION_LABELS,
  normalizeJurisdictionList,
  isJurisdictionCode,
  type JurisdictionCode,
} from "./jurisdictions";

export {
  PLATFORM_ROLES,
  LEGACY_SUPPORT_ROLE,
  normalizePlatformRole,
  isPlatformRole,
  type PlatformRole,
} from "./platform-roles";

export {
  EVIDENCE_MAP_MODES,
  EVIDENCE_MAP_MODE_LABELS,
  emptyEvidenceMap,
  evidenceMapFromLegacy,
  normalizeEvidenceMap,
  isEvidenceMapComplete,
  type EvidenceMap,
  type EvidenceMapMode,
} from "./control-points";
