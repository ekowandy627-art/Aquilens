import { randomUUID } from "crypto";
import { GUIDANCE_SELECTION_VALUES } from "@aquilens/shared";
import type { GuidanceSelectionStatus } from "@aquilens/shared";
import { buildMvpGuidanceSeed } from "./mvp-guidance-packs.seed";
import type {
  DepartmentGuidanceLink,
  GuidancePackRecord,
  GuidanceRequirementRecord,
  OrganisationProfile,
  ProcessGuidanceLink,
  TenantGuidanceSelectionRecord,
} from "./guidance.types";

type GuidanceStoreState = {
  packs: Map<string, GuidancePackRecord>;
  packsBySlug: Map<string, GuidancePackRecord>;
  requirements: Map<string, GuidanceRequirementRecord>;
  requirementsByPack: Map<string, GuidanceRequirementRecord[]>;
  selections: Map<string, TenantGuidanceSelectionRecord>;
  departmentLinks: Map<string, DepartmentGuidanceLink[]>;
  processLinks: Map<string, ProcessGuidanceLink[]>;
  organisationProfiles: Map<string, OrganisationProfile>;
};

function selectionKey(tenantId: string, packId: string) {
  return `${tenantId}:${packId}`;
}

function buildInitialState(): GuidanceStoreState {
  const seed = buildMvpGuidanceSeed();
  const packs = new Map(seed.packs.map((pack) => [pack.id, pack]));
  const packsBySlug = new Map(seed.packs.map((pack) => [pack.slug, pack]));
  const requirements = new Map(
    seed.requirements.map((row) => [row.id, row]),
  );
  const requirementsByPack = new Map<string, GuidanceRequirementRecord[]>();

  for (const row of seed.requirements) {
    const existing = requirementsByPack.get(row.packId) ?? [];
    existing.push(row);
    requirementsByPack.set(row.packId, existing);
  }

  for (const [packId, rows] of requirementsByPack) {
    requirementsByPack.set(
      packId,
      rows.toSorted((a, b) => a.sortOrder - b.sortOrder),
    );
  }

  return {
    packs,
    packsBySlug,
    requirements,
    requirementsByPack,
    selections: new Map(),
    departmentLinks: new Map(),
    processLinks: new Map(),
    organisationProfiles: new Map(),
  };
}

let state = buildInitialState();

export class GuidanceDemoStore {
  listAllPacks() {
    return [...state.packs.values()].toSorted((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  listActivePacks(filters?: { sector?: string; jurisdiction?: string }) {
    let packs = [...state.packs.values()].filter((pack) => pack.isActive);

    if (filters?.sector) {
      const sector = filters.sector.toLowerCase();
      packs = packs.filter(
        (pack) =>
          pack.sector.includes("general") ||
          pack.sector.some((value) => value.toLowerCase() === sector),
      );
    }

    if (filters?.jurisdiction) {
      const jurisdiction = filters.jurisdiction.toLowerCase();
      packs = packs.filter(
        (pack) =>
          pack.jurisdiction.includes("global") ||
          pack.jurisdiction.some(
            (value) => value.toLowerCase() === jurisdiction,
          ),
      );
    }

    return packs.toSorted((a, b) => a.name.localeCompare(b.name));
  }

  listPacksVisibleToTenant(tenantId: string, filters?: { sector?: string; jurisdiction?: string }) {
    const selectedPackIds = new Set(
      this.listSelections(tenantId).map((row) => row.packId),
    );
    const active = this.listActivePacks(filters);
    const inactiveSelected = [...state.packs.values()].filter(
      (pack) => !pack.isActive && selectedPackIds.has(pack.id),
    );
    const merged = new Map<string, GuidancePackRecord>();
    for (const pack of [...active, ...inactiveSelected]) {
      merged.set(pack.id, pack);
    }
    return [...merged.values()].toSorted((a, b) => a.name.localeCompare(b.name));
  }

  getPackBySlug(slug: string) {
    return state.packsBySlug.get(slug) ?? null;
  }

  getPackById(packId: string) {
    return state.packs.get(packId) ?? null;
  }

  listRequirements(packId: string) {
    return state.requirementsByPack.get(packId) ?? [];
  }

  listSelections(tenantId: string) {
    return [...state.selections.values()]
      .filter((row) => row.tenantId === tenantId)
      .toSorted((a, b) => a.selectedAt.localeCompare(b.selectedAt));
  }

  upsertSelections(
    tenantId: string,
    userId: string,
    items: Array<{ packId: string; selectionStatus: GuidanceSelectionStatus }>,
  ) {
    const now = new Date().toISOString();
    const results: TenantGuidanceSelectionRecord[] = [];

    for (const item of items) {
      if (!GUIDANCE_SELECTION_VALUES.includes(item.selectionStatus)) {
        throw new Error(`Invalid selection status: ${item.selectionStatus}`);
      }
      const pack = state.packs.get(item.packId);
      if (!pack) {
        throw new Error(`Unknown guidance pack: ${item.packId}`);
      }

      const key = selectionKey(tenantId, item.packId);
      const existing = state.selections.get(key);
      const record: TenantGuidanceSelectionRecord = {
        id: existing?.id ?? randomUUID(),
        tenantId,
        packId: item.packId,
        selectionStatus: item.selectionStatus,
        selectedAt: now,
        selectedBy: userId,
      };
      state.selections.set(key, record);
      results.push(record);
    }

    return results;
  }

  setOrganisationProfile(tenantId: string, profile: OrganisationProfile) {
    state.organisationProfiles.set(tenantId, profile);
    return profile;
  }

  getOrganisationProfile(tenantId: string) {
    return state.organisationProfiles.get(tenantId) ?? {};
  }

  replaceFunctionGuidance(
    tenantId: string,
    functionId: string,
    packIds: string[],
  ) {
    for (const packId of packIds) {
      if (!state.packs.has(packId)) {
        throw new Error(`Unknown guidance pack: ${packId}`);
      }
    }
    const links: DepartmentGuidanceLink[] = packIds.map((packId) => ({
      tenantId,
      functionId,
      packId,
    }));
    state.departmentLinks.set(`${tenantId}:${functionId}`, links);
    return links;
  }

  listFunctionGuidance(tenantId: string, functionId: string) {
    return state.departmentLinks.get(`${tenantId}:${functionId}`) ?? [];
  }

  replaceProcessGuidance(
    tenantId: string,
    processId: string,
    links: Array<{ packId: string; requirementId?: string }>,
  ) {
    for (const link of links) {
      if (!state.packs.has(link.packId)) {
        throw new Error(`Unknown guidance pack: ${link.packId}`);
      }
      if (
        link.requirementId &&
        !state.requirements.has(link.requirementId)
      ) {
        throw new Error(`Unknown requirement: ${link.requirementId}`);
      }
    }
    const rows: ProcessGuidanceLink[] = links.map((link) => ({
      tenantId,
      processId,
      packId: link.packId,
      requirementId: link.requirementId,
    }));
    state.processLinks.set(`${tenantId}:${processId}`, rows);
    return rows;
  }

  listProcessGuidance(tenantId: string, processId: string) {
    return state.processLinks.get(`${tenantId}:${processId}`) ?? [];
  }

  setPackActive(packId: string, isActive: boolean) {
    const pack = state.packs.get(packId);
    if (!pack) {
      return null;
    }
    pack.isActive = isActive;
    return pack;
  }

  createPack(pack: GuidancePackRecord) {
    state.packs.set(pack.id, pack);
    state.packsBySlug.set(pack.slug, pack);
    return pack;
  }

  updatePack(packId: string, patch: Partial<GuidancePackRecord>) {
    const pack = state.packs.get(packId);
    if (!pack) {
      return null;
    }
    Object.assign(pack, patch);
    if (patch.slug) {
      state.packsBySlug.set(pack.slug, pack);
    }
    return pack;
  }

  addRequirement(requirement: GuidanceRequirementRecord) {
    state.requirements.set(requirement.id, requirement);
    const rows = state.requirementsByPack.get(requirement.packId) ?? [];
    rows.push(requirement);
    state.requirementsByPack.set(
      requirement.packId,
      rows.toSorted((a, b) => a.sortOrder - b.sortOrder),
    );
    return requirement;
  }

  updateRequirement(
    packId: string,
    reqId: string,
    patch: Partial<GuidanceRequirementRecord>,
  ) {
    const existing = state.requirements.get(reqId);
    if (!existing || existing.packId !== packId) {
      return null;
    }
    Object.assign(existing, patch);
    return existing;
  }

  deleteRequirement(packId: string, reqId: string) {
    const existing = state.requirements.get(reqId);
    if (!existing || existing.packId !== packId) {
      return null;
    }
    state.requirements.delete(reqId);
    const rows = (state.requirementsByPack.get(packId) ?? []).filter(
      (row) => row.id !== reqId,
    );
    state.requirementsByPack.set(packId, rows);
    return true;
  }
}

export const guidanceDemoStore = new GuidanceDemoStore();

export function resetGuidanceDemoStore() {
  state = buildInitialState();
}
