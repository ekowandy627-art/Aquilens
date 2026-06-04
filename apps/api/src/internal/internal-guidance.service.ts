import { HttpException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { LEGAL_DISCLAIMER } from "@aquilens/shared";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { NotificationsService } from "../notifications/notifications.service";
import { usePlatformOpsDemoStore } from "../platform-ops/platform-ops-env";
import { guidanceDemoStore } from "../standards/guidance-demo.store";
import type {
  GuidancePackRecord,
  GuidanceRequirementRecord,
} from "../standards/guidance.types";
import { platformAuditDemoStore } from "./platform-audit-demo.store";

export type GuidancePackSummary = {
  id: string;
  slug: string;
  name: string;
  packType: string;
  sector: string[];
  jurisdiction: string[];
  versionLabel: string;
  effectiveDate: string;
  summary: string;
  isActive: boolean;
  familyId?: string;
  version?: number;
  status?: string;
  isLatestPublished?: boolean;
  requirementCount?: number;
  tenantAdoptionCount?: number;
};

type PackVersionMeta = {
  familyId: string;
  canonicalSlug: string;
  version: number;
  status: "draft" | "published" | "archived";
  isLatestPublished: boolean;
  publishedAt?: string;
  supersedesPackId?: string;
  changelog?: string;
};

const versionMeta = new Map<string, PackVersionMeta>();

export function resetGuidanceVersionMeta() {
  versionMeta.clear();
}

export function getGuidancePackMeta(packId: string) {
  const pack = guidanceDemoStore.getPackById(packId);
  if (!pack) {
    return null;
  }
  return ensureMeta(pack);
}

export function findLatestPublishedInFamily(familyId: string) {
  let latest: {
    pack: GuidancePackRecord;
    meta: PackVersionMeta;
  } | null = null;

  for (const pack of guidanceDemoStore.listAllPacks()) {
    const meta = ensureMeta(pack);
    if (meta.familyId !== familyId || !meta.isLatestPublished) {
      continue;
    }
    if (!latest || meta.version > latest.meta.version) {
      latest = { pack, meta };
    }
  }

  return latest;
}

function ensureMeta(pack: GuidancePackRecord): PackVersionMeta {
  let meta = versionMeta.get(pack.id);
  if (!meta) {
    meta = {
      familyId: pack.id,
      canonicalSlug: pack.slug,
      version: 1,
      status: pack.isActive ? "published" : "archived",
      isLatestPublished: pack.isActive,
      publishedAt: pack.createdAt,
    };
    versionMeta.set(pack.id, meta);
  }
  return meta;
}

@Injectable()
export class InternalGuidanceService {
  constructor(
    @Inject(NotificationsService)
    private readonly notifications: NotificationsService,
  ) {}

  listPacks(): GuidancePackSummary[] {
    return guidanceDemoStore.listAllPacks().map((pack) => this.toSummary(pack));
  }

  async listPacksAsync(): Promise<GuidancePackSummary[]> {
    const supabase = getSupabaseAdminClient();
    if (!supabase || usePlatformOpsDemoStore()) {
      return this.listPacks().map((pack) => ({
        ...pack,
        requirementCount: guidanceDemoStore.listRequirements(pack.id).length,
        tenantAdoptionCount: 0,
      }));
    }

    const { data, error } = await supabase.from("guidance_packs").select("*").order("name");
    if (error) {
      throw new HttpException(error.message, 500);
    }
    if ((data ?? []).length === 0) {
      return this.listPacks();
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      packType: row.pack_type as string,
      sector: (row.sector as string[]) ?? [],
      jurisdiction: (row.jurisdiction as string[]) ?? [],
      versionLabel: row.version_label as string,
      effectiveDate: row.effective_date as string,
      summary: (row.summary as string) ?? "",
      isActive: Boolean(row.is_active),
      familyId: row.family_id as string,
      version: row.version as number,
      status: row.status as string,
      isLatestPublished: Boolean(row.is_latest_published),
    }));
  }

  getPack(packId: string) {
    const pack = guidanceDemoStore.getPackById(packId);
    if (!pack) {
      throw new HttpException("Guidance pack not found", 404);
    }
    const meta = ensureMeta(pack);
    return {
      ...this.toSummary(pack),
      disclaimer: pack.disclaimer,
      requirements: guidanceDemoStore.listRequirements(packId),
      familyId: meta.familyId,
      version: meta.version,
      status: meta.status,
      isLatestPublished: meta.isLatestPublished,
      publishedAt: meta.publishedAt,
    };
  }

  createPack(dto: {
    slug: string;
    name: string;
    packType: GuidancePackRecord["packType"];
    sector?: string[];
    jurisdiction?: string[];
    versionLabel?: string;
    effectiveDate?: string;
    summary?: string;
    requirements?: Array<Partial<GuidanceRequirementRecord>>;
  }) {
    const id = randomUUID();
    const pack: GuidancePackRecord = {
      id,
      slug: dto.slug,
      name: dto.name,
      packType: dto.packType,
      sector: dto.sector ?? ["general"],
      jurisdiction: dto.jurisdiction ?? ["global"],
      versionLabel: dto.versionLabel ?? "v1 draft",
      effectiveDate: dto.effectiveDate ?? new Date().toISOString().slice(0, 10),
      disclaimer: LEGAL_DISCLAIMER,
      summary: dto.summary ?? "",
      isActive: false,
      createdAt: new Date().toISOString(),
    };
    guidanceDemoStore.createPack(pack);
    versionMeta.set(id, {
      familyId: id,
      canonicalSlug: dto.slug,
      version: 1,
      status: "draft",
      isLatestPublished: false,
    });

    for (const [index, req] of (dto.requirements ?? []).entries()) {
      guidanceDemoStore.addRequirement({
        id: randomUUID(),
        packId: id,
        requirementArea: req.requirementArea ?? `Area ${index + 1}`,
        summary: req.summary ?? "",
        appliesTo: req.appliesTo ?? "organisation",
        suggestedSopTitles: req.suggestedSopTitles ?? [],
        requiredControls: req.requiredControls ?? [],
        evidenceExpected: req.evidenceExpected ?? [],
        riskIfMissing: req.riskIfMissing,
        auditChecks: req.auditChecks ?? [],
        sortOrder: req.sortOrder ?? index + 1,
      });
    }

    platformAuditDemoStore.append({
      actorEmail: "platform@aquilens.internal",
      eventType: "guidance_pack.created",
      entityType: "guidance_pack",
      entityId: id,
      entityName: pack.name,
      action: `Created guidance pack ${pack.name}`,
      metadata: { slug: pack.slug },
    });

    return this.getPack(id);
  }

  updatePack(packId: string, patch: Partial<GuidancePackRecord>) {
    const updated = guidanceDemoStore.updatePack(packId, patch);
    if (!updated) {
      throw new HttpException("Guidance pack not found", 404);
    }
    return this.getPack(packId);
  }

  addRequirement(packId: string, dto: Partial<GuidanceRequirementRecord>) {
    if (!guidanceDemoStore.getPackById(packId)) {
      throw new HttpException("Guidance pack not found", 404);
    }
    const req: GuidanceRequirementRecord = {
      id: randomUUID(),
      packId,
      requirementArea: dto.requirementArea ?? "New area",
      summary: dto.summary ?? "",
      appliesTo: dto.appliesTo ?? "organisation",
      suggestedSopTitles: dto.suggestedSopTitles ?? [],
      requiredControls: dto.requiredControls ?? [],
      evidenceExpected: dto.evidenceExpected ?? [],
      riskIfMissing: dto.riskIfMissing,
      auditChecks: dto.auditChecks ?? [],
      sortOrder: dto.sortOrder ?? guidanceDemoStore.listRequirements(packId).length + 1,
      referenceCode: dto.referenceCode,
    };
    guidanceDemoStore.addRequirement(req);
    return req;
  }

  updateRequirement(packId: string, reqId: string, patch: Partial<GuidanceRequirementRecord>) {
    const updated = guidanceDemoStore.updateRequirement(packId, reqId, patch);
    if (!updated) {
      throw new HttpException("Requirement not found", 404);
    }
    return updated;
  }

  deleteRequirement(packId: string, reqId: string) {
    const removed = guidanceDemoStore.deleteRequirement(packId, reqId);
    if (!removed) {
      throw new HttpException("Requirement not found", 404);
    }
    return { deleted: true };
  }

  createNewVersion(packId: string) {
    const source = guidanceDemoStore.getPackById(packId);
    if (!source) {
      throw new HttpException("Guidance pack not found", 404);
    }
    const sourceMeta = ensureMeta(source);
    const nextVersion = sourceMeta.version + 1;
    const newId = randomUUID();
    const draft: GuidancePackRecord = {
      ...source,
      id: newId,
      slug: `${sourceMeta.canonicalSlug}-v${nextVersion}`,
      versionLabel: `${source.versionLabel} (draft v${nextVersion})`,
      isActive: false,
      createdAt: new Date().toISOString(),
    };
    guidanceDemoStore.createPack(draft);
    versionMeta.set(newId, {
      familyId: sourceMeta.familyId,
      canonicalSlug: sourceMeta.canonicalSlug,
      version: nextVersion,
      status: "draft",
      isLatestPublished: false,
      supersedesPackId: packId,
    });

    for (const req of guidanceDemoStore.listRequirements(packId)) {
      guidanceDemoStore.addRequirement({ ...req, id: randomUUID(), packId: newId });
    }

    return this.getPack(newId);
  }

  async publishPack(packId: string, changelog: string) {
    if (!changelog.trim()) {
      throw new HttpException("Changelog is required to publish", 422);
    }
    const pack = guidanceDemoStore.getPackById(packId);
    if (!pack) {
      throw new HttpException("Guidance pack not found", 404);
    }
    const meta = ensureMeta(pack);
    if (meta.status === "published") {
      throw new HttpException("Pack is already published", 422);
    }

    for (const [id, other] of versionMeta) {
      if (other.familyId === meta.familyId && other.isLatestPublished) {
        other.isLatestPublished = false;
        versionMeta.set(id, other);
        const otherPack = guidanceDemoStore.getPackById(id);
        if (otherPack) {
          guidanceDemoStore.updatePack(id, { isActive: false });
        }
      }
    }

    meta.status = "published";
    meta.isLatestPublished = true;
    meta.publishedAt = new Date().toISOString();
    meta.changelog = changelog.trim();
    versionMeta.set(packId, meta);
    guidanceDemoStore.updatePack(packId, { isActive: true });

    await this.notifySubscribers(meta.familyId, pack, changelog.trim());

    platformAuditDemoStore.append({
      actorEmail: "platform@aquilens.internal",
      eventType: "guidance_pack.published",
      entityType: "guidance_pack",
      entityId: packId,
      entityName: pack.name,
      action: `Published ${pack.name} v${meta.version}`,
      metadata: { changelog: changelog.trim() },
    });

    return this.getPack(packId);
  }

  listFamilyVersions(familyId: string) {
    return guidanceDemoStore
      .listAllPacks()
      .filter((pack) => ensureMeta(pack).familyId === familyId)
      .map((pack) => ({
        ...this.toSummary(pack),
        ...ensureMeta(pack),
      }))
      .toSorted((a, b) => (a.version ?? 0) - (b.version ?? 0));
  }

  getAdoption(packId: string) {
    const pack = guidanceDemoStore.getPackById(packId);
    if (!pack) {
      throw new HttpException("Guidance pack not found", 404);
    }
    const meta = ensureMeta(pack);
    const tenants = ["tenant-gis", "tenant-mfg", "tenant-hospital"];
    return tenants.map((tenantId) => {
      const selections = guidanceDemoStore.listSelections(tenantId);
      const pinned = selections.find((s) => s.packId === packId);
      const onFamily = selections.filter((s) => {
        const p = guidanceDemoStore.getPackById(s.packId);
        return p && ensureMeta(p).familyId === meta.familyId;
      });
      return {
        tenantId,
        pinnedPackId: pinned?.packId ?? null,
        selectionCount: onFamily.length,
      };
    });
  }

  async setPackActive(packId: string, isActive: boolean) {
    const supabase = getSupabaseAdminClient();
    if (!supabase || usePlatformOpsDemoStore()) {
      const updated = guidanceDemoStore.setPackActive(packId, isActive);
      if (!updated) {
        throw new HttpException("Guidance pack not found", 404);
      }
      return this.toSummary(updated);
    }

    const { data, error } = await supabase
      .from("guidance_packs")
      .update({ is_active: isActive })
      .eq("id", packId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new HttpException(error?.message ?? "Guidance pack not found", 404);
    }

    guidanceDemoStore.setPackActive(packId, isActive);
    return this.toSummary(guidanceDemoStore.getPackById(packId)!);
  }

  private async notifySubscribers(
    familyId: string,
    pack: GuidancePackRecord,
    changelog: string,
  ) {
    for (const tenantId of ["tenant-gis", "tenant-mfg", "tenant-hospital"]) {
      const selections = guidanceDemoStore.listSelections(tenantId);
      const subscribed = selections.some((s) => {
        const p = guidanceDemoStore.getPackById(s.packId);
        return p && ensureMeta(p).familyId === familyId && s.packId !== pack.id;
      });
      if (!subscribed) continue;

      await this.notifications.create({
        tenantId,
        userId: "user-gis-owner",
        type: "standards_update_available",
        title: `${pack.name} — version published`,
        body: changelog,
        entityType: "guidance_pack",
        entityId: pack.id,
        entityName: pack.name,
      });
    }
  }

  private toSummary(pack: GuidancePackRecord): GuidancePackSummary {
    const meta = ensureMeta(pack);
    return {
      id: pack.id,
      slug: pack.slug,
      name: pack.name,
      packType: pack.packType,
      sector: pack.sector,
      jurisdiction: pack.jurisdiction,
      versionLabel: pack.versionLabel,
      effectiveDate: pack.effectiveDate,
      summary: pack.summary,
      isActive: pack.isActive,
      familyId: meta.familyId,
      version: meta.version,
      status: meta.status,
      isLatestPublished: meta.isLatestPublished,
    };
  }
}
