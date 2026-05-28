import type { GuidanceSelectionStatus } from "@aquilens/shared";

export type GuidancePackType =
  | "standard"
  | "regulation"
  | "policy"
  | "guidance_area";

export type GuidanceAppliesTo =
  | "organisation"
  | "department"
  | "process"
  | "sop";

export type GuidanceAuditCheck = {
  id: string;
  question: string;
};

export type GuidancePackRecord = {
  id: string;
  slug: string;
  name: string;
  packType: GuidancePackType;
  sector: string[];
  jurisdiction: string[];
  versionLabel: string;
  effectiveDate: string;
  disclaimer: string;
  summary: string;
  isActive: boolean;
  createdAt: string;
};

export type GuidanceRequirementRecord = {
  id: string;
  packId: string;
  requirementArea: string;
  referenceCode?: string;
  summary: string;
  appliesTo: GuidanceAppliesTo;
  suggestedSopTitles: string[];
  requiredControls: unknown[];
  evidenceExpected: string[];
  riskIfMissing?: string;
  auditChecks: GuidanceAuditCheck[];
  sortOrder: number;
};

export type TenantGuidanceSelectionRecord = {
  id: string;
  tenantId: string;
  packId: string;
  selectionStatus: GuidanceSelectionStatus;
  selectedAt: string;
  selectedBy?: string;
};

export type OrganisationProfile = {
  organisationType?: string;
  countries?: string[];
  multiSite?: boolean;
  staffBand?: string;
  goals?: string[];
  regulators?: string[];
  certificationTargets?: string[];
};

export type DepartmentGuidanceLink = {
  tenantId: string;
  functionId: string;
  packId: string;
};

export type ProcessGuidanceLink = {
  tenantId: string;
  processId: string;
  packId: string;
  requirementId?: string;
};
