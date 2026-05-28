import { apiFetch } from "@/lib/api-client";
import type { GuidanceSelectionStatus } from "@aquilens/shared";

export type GuidancePackSummary = {
  id: string;
  slug: string;
  name: string;
  packType: string;
  sector: string[];
  jurisdiction: string[];
  versionLabel: string;
  effectiveDate: string;
  disclaimer: string;
  summary: string;
  isActive: boolean;
};

export type GuidanceRequirement = {
  id: string;
  packId: string;
  requirementArea: string;
  summary: string;
  appliesTo: string;
  auditChecks: Array<{ id: string; question: string }>;
};

export type GuidancePackDetail = GuidancePackSummary & {
  requirements: GuidanceRequirement[];
};

export type GuidanceRecommendation = {
  slug: string;
  name: string;
  summary: string;
  disclaimer: string;
  sector: string[];
  jurisdiction: string[];
};

export type TenantGuidanceSelection = {
  id: string;
  packId: string;
  packSlug?: string;
  packName?: string;
  selectionStatus: GuidanceSelectionStatus;
  selectedAt: string;
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

export type LinkedGuidance = {
  packId: string;
  packSlug?: string;
  packName?: string;
  requirementId?: string;
};

export async function listGuidancePacks(filters?: {
  sector?: string;
  jurisdiction?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.sector) {
    params.set("sector", filters.sector);
  }
  if (filters?.jurisdiction) {
    params.set("jurisdiction", filters.jurisdiction);
  }
  const query = params.toString();
  return apiFetch<GuidancePackSummary[]>(
    `/guidance/packs${query ? `?${query}` : ""}`,
  );
}

export async function getGuidanceRecommendations(input: {
  organisationType?: string;
  country?: string;
}) {
  const params = new URLSearchParams();
  if (input.organisationType) {
    params.set("organisationType", input.organisationType);
  }
  if (input.country) {
    params.set("country", input.country);
  }
  return apiFetch<GuidanceRecommendation[]>(
    `/guidance/recommendations?${params.toString()}`,
  );
}

export async function listGuidanceSelections() {
  return apiFetch<TenantGuidanceSelection[]>("/tenants/me/guidance-selections");
}

export async function saveGuidanceSelections(
  selections: Array<{ packId: string; selectionStatus: GuidanceSelectionStatus }>,
) {
  return apiFetch<TenantGuidanceSelection[]>("/tenants/me/guidance-selections", {
    method: "PUT",
    body: JSON.stringify({ selections }),
  });
}

export async function saveOrganisationProfile(profile: OrganisationProfile) {
  return apiFetch<OrganisationProfile>("/tenants/me/organisation-profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function linkFunctionGuidance(functionId: string, packIds: string[]) {
  return apiFetch(`/functions/${functionId}/guidance`, {
    method: "PUT",
    body: JSON.stringify({ packIds }),
  });
}

export async function listFunctionGuidance(functionId: string) {
  return apiFetch<LinkedGuidance[]>(`/functions/${functionId}/guidance`);
}

export async function linkProcessGuidance(
  processId: string,
  links: Array<{ packId: string; requirementId?: string }>,
) {
  return apiFetch(`/processes/${processId}/guidance`, {
    method: "PUT",
    body: JSON.stringify({ links }),
  });
}
