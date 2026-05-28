import {
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GUIDANCE_SELECTION_VALUES } from "@aquilens/shared";
import type { GuidanceSelectionStatus } from "@aquilens/shared";
import type { AuthUser } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import { getSupabaseForUser } from "../demo/demo-data-mode";
import { processDemoStore } from "../processes/process-demo.store";
import { guidanceDemoStore } from "./guidance-demo.store";
import { StandardsRecommendationService } from "./standards-recommendation.service";
import type { OrganisationProfile } from "./guidance.types";

@Injectable()
export class StandardsService {
  constructor(
    @Inject(StandardsRecommendationService)
    private readonly recommendations: StandardsRecommendationService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  listPacks(
    user: AuthUser,
    filters?: { sector?: string; jurisdiction?: string },
  ) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return guidanceDemoStore.listPacksVisibleToTenant(user.tenantId, filters);
    }
    return guidanceDemoStore.listPacksVisibleToTenant(user.tenantId, filters);
  }

  getPackBySlug(user: AuthUser, slug: string) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      const pack = guidanceDemoStore.getPackBySlug(slug);
      if (!pack) {
        return null;
      }
      return {
        ...pack,
        requirements: guidanceDemoStore.listRequirements(pack.id),
      };
    }

    const pack = guidanceDemoStore.getPackBySlug(slug);
    if (!pack) {
      return null;
    }
    return {
      ...pack,
      requirements: guidanceDemoStore.listRequirements(pack.id),
    };
  }

  getRecommendations(
    user: AuthUser,
    query: {
      organisationType?: string;
      country?: string;
      certificationTargets?: string;
    },
  ) {
    const profile = guidanceDemoStore.getOrganisationProfile(user.tenantId);
    const slugs = this.recommendations.recommendPackSlugs({
      organisationType: query.organisationType ?? profile.organisationType,
      country: query.country ?? profile.countries?.[0],
      certificationTargets: query.certificationTargets
        ? query.certificationTargets.split(",").map((value) => value.trim())
        : profile.certificationTargets,
    });

    return slugs
      .map((slug) => guidanceDemoStore.getPackBySlug(slug))
      .filter((pack): pack is NonNullable<typeof pack> => Boolean(pack))
      .map((pack) => ({
        slug: pack.slug,
        name: pack.name,
        summary: pack.summary,
        disclaimer: pack.disclaimer,
        sector: pack.sector,
        jurisdiction: pack.jurisdiction,
      }));
  }

  listSelections(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return this.enrichSelections(
        guidanceDemoStore.listSelections(user.tenantId),
      );
    }
    return this.enrichSelections(
      guidanceDemoStore.listSelections(user.tenantId),
    );
  }

  async upsertSelections(
    user: AuthUser,
    items: Array<{ packId: string; selectionStatus: GuidanceSelectionStatus }>,
  ) {
    for (const item of items) {
      if (!GUIDANCE_SELECTION_VALUES.includes(item.selectionStatus)) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `Invalid selection status: ${item.selectionStatus}`,
              status: 422,
            },
          },
          422,
        );
      }
    }

    const before = guidanceDemoStore.listSelections(user.tenantId);
    let saved;

    try {
      saved = guidanceDemoStore.upsertSelections(
        user.tenantId,
        user.id,
        items,
      );
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Invalid selection payload",
            status: 422,
          },
        },
        422,
      );
    }

    await this.audit.log(user, {
      eventType: "standard.selected",
      entityType: "GuidancePack",
      entityId: items.map((item) => item.packId).join(","),
      entityName: "Guidance selections",
      action: "Updated tenant guidance selections",
      beforeState: { selections: before },
      afterState: { selections: saved },
      metadata: { count: saved.length },
    });

    return this.enrichSelections(saved);
  }

  updateOrganisationProfile(user: AuthUser, profile: OrganisationProfile) {
    return guidanceDemoStore.setOrganisationProfile(user.tenantId, profile);
  }

  getOrganisationProfile(user: AuthUser) {
    return guidanceDemoStore.getOrganisationProfile(user.tenantId);
  }

  replaceFunctionGuidance(
    user: AuthUser,
    functionId: string,
    packIds: string[],
  ) {
    try {
      const links = guidanceDemoStore.replaceFunctionGuidance(
        user.tenantId,
        functionId,
        packIds,
      );
      return this.enrichDepartmentLinks(links);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Invalid function guidance",
            status: 422,
          },
        },
        422,
      );
    }
  }

  listFunctionGuidance(user: AuthUser, functionId: string) {
    return this.enrichDepartmentLinks(
      guidanceDemoStore.listFunctionGuidance(user.tenantId, functionId),
    );
  }

  replaceProcessGuidance(
    user: AuthUser,
    processId: string,
    links: Array<{ packId: string; requirementId?: string }>,
  ) {
    const process = processDemoStore.getProcess(user.tenantId, processId);
    if (!process) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Process not found.",
          status: 404,
        },
      });
    }

    try {
      const rows = guidanceDemoStore.replaceProcessGuidance(
        user.tenantId,
        processId,
        links,
      );
      return this.enrichProcessLinks(rows);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message:
              error instanceof Error ? error.message : "Invalid process guidance",
            status: 422,
          },
        },
        422,
      );
    }
  }

  listProcessGuidance(user: AuthUser, processId: string) {
    const process = processDemoStore.getProcess(user.tenantId, processId);
    if (!process) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Process not found.",
          status: 404,
        },
      });
    }
    return this.enrichProcessLinks(
      guidanceDemoStore.listProcessGuidance(user.tenantId, processId),
    );
  }

  private enrichSelections(rows: ReturnType<typeof guidanceDemoStore.listSelections>) {
    return rows.map((row) => {
      const pack = guidanceDemoStore.getPackById(row.packId);
      return {
        id: row.id,
        packId: row.packId,
        packSlug: pack?.slug,
        packName: pack?.name,
        selectionStatus: row.selectionStatus,
        selectedAt: row.selectedAt,
        selectedBy: row.selectedBy,
      };
    });
  }

  private enrichDepartmentLinks(
    links: ReturnType<typeof guidanceDemoStore.listFunctionGuidance>,
  ) {
    return links.map((link) => {
      const pack = guidanceDemoStore.getPackById(link.packId);
      return {
        packId: link.packId,
        packSlug: pack?.slug,
        packName: pack?.name,
        functionId: link.functionId,
      };
    });
  }

  private enrichProcessLinks(
    links: ReturnType<typeof guidanceDemoStore.listProcessGuidance>,
  ) {
    return links.map((link) => {
      const pack = guidanceDemoStore.getPackById(link.packId);
      return {
        packId: link.packId,
        packSlug: pack?.slug,
        packName: pack?.name,
        requirementId: link.requirementId,
        processId: link.processId,
      };
    });
  }
}
