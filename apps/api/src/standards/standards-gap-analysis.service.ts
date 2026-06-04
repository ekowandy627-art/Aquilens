import { HttpException, Inject, Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import type { AuthUser } from "../auth/auth.types";
import { getSupabaseForUser } from "../demo/demo-data-mode";
import { AiQuotaService } from "../platform-ops/ai-quota.service";
import { AiUsageService } from "../platform-ops/ai-usage.service";
import { PlatformAiAgentRegistryService } from "../platform-ops/platform-ai-agent-registry.service";
import { isPlatformBlockedError } from "../platform-ops/platform-error";
import type { PlatformErrorBody } from "../platform-ops/platform-ops.types";
import { WallNoticeService } from "../platform-ops/wall-notice.service";
import {
  findLatestPublishedInFamily,
  getGuidancePackMeta,
} from "../internal/internal-guidance.service";
import { guidanceDemoStore } from "./guidance-demo.store";
import {
  resetStandardsGapDemoStore,
  standardsGapDemoStore,
} from "./standards-gap-demo.store";

const AGENT_KEY = "standards_gap_analysis";

export function resetStandardsGapAnalysisForTests() {
  resetStandardsGapDemoStore();
}

@Injectable()
export class StandardsGapAnalysisService {
  constructor(
    @Inject(AiQuotaService) private readonly aiQuota: AiQuotaService,
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
    @Inject(PlatformAiAgentRegistryService)
    private readonly agentRegistry: PlatformAiAgentRegistryService,
    @Inject(WallNoticeService) private readonly wallNotice: WallNoticeService,
  ) {}

  listAvailableUpdates(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (supabase) {
      return this.listAvailableUpdatesFromSupabase(user);
    }

    const selections = guidanceDemoStore.listSelections(user.tenantId);
    const updates = [];

    for (const selection of selections) {
      const pinnedMeta = getGuidancePackMeta(selection.packId);
      if (!pinnedMeta) {
        continue;
      }
      const latest = findLatestPublishedInFamily(pinnedMeta.familyId);
      if (!latest || latest.pack.id === selection.packId) {
        continue;
      }
      const pinnedPack = guidanceDemoStore.getPackById(selection.packId);
      if (!pinnedPack) {
        continue;
      }
      updates.push({
        familyId: pinnedMeta.familyId,
        packName: pinnedPack.name,
        canonicalSlug: pinnedMeta.canonicalSlug,
        pinnedPackId: selection.packId,
        pinnedVersion: pinnedMeta.version,
        latestPackId: latest.pack.id,
        latestVersion: latest.meta.version,
        changelog: latest.meta.changelog ?? null,
      });
    }

    return updates;
  }

  async runGapAnalysis(user: AuthUser, familyId: string) {
    try {
      await this.aiQuota.assertAgentAllowed(user.tenantId, AGENT_KEY);
    } catch (error) {
      if (isPlatformBlockedError(error)) {
        const body = error.getResponse() as PlatformErrorBody;
        await this.wallNotice.notifyWallHit(user, body.error.code as import("../platform-ops/platform-ops.types").WallErrorCode);
      }
      throw error;
    }

    const updates = await this.listAvailableUpdates(user);
    const match = updates.find((row) => row.familyId === familyId);
    if (!match) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "No published update available for this standards family.",
            status: 404,
          },
        },
        404,
      );
    }

    const fromReqs = guidanceDemoStore.listRequirements(match.pinnedPackId);
    const toReqs = guidanceDemoStore.listRequirements(match.latestPackId);
    const fromByArea = new Map(fromReqs.map((row) => [row.requirementArea, row]));
    const toByArea = new Map(toReqs.map((row) => [row.requirementArea, row]));

    const added = toReqs.filter((row) => !fromByArea.has(row.requirementArea));
    const removed = fromReqs.filter((row) => !toByArea.has(row.requirementArea));
    const changed = toReqs.filter((row) => {
      const prior = fromByArea.get(row.requirementArea);
      return prior != null && prior.summary !== row.summary;
    });

    const diff = { added, removed, changed };
    const prompt = await this.agentRegistry.getPrompt(AGENT_KEY);
    const model = await this.agentRegistry.getDefaultModel(AGENT_KEY);
    const diffHash = createHash("sha256")
      .update(JSON.stringify(diff))
      .digest("hex")
      .slice(0, 16);

    const aiNarrative = {
      summary: `Found ${added.length} new, ${changed.length} changed, and ${removed.length} removed requirements.`,
      recommendations: [
        ...added.slice(0, 3).map((row) => ({
          priority: "high",
          area: row.requirementArea,
          action: `Review new requirement: ${row.summary}`,
        })),
      ],
      model: process.env.ANTHROPIC_API_KEY ? model : "mock-claude-sonnet-4-6",
    };

    await this.aiUsage.recordEvent({
      tenantId: user.tenantId,
      platformAgentKey: AGENT_KEY,
      promptVersion: prompt.version,
      model: aiNarrative.model,
      provider: "anthropic",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 1,
      success: true,
      cacheHit: !process.env.ANTHROPIC_API_KEY,
      jsonValid: true,
      inputCharCount: JSON.stringify(diff).length,
      userContentHash: diffHash,
      actorUserId: user.id,
    });

    const record = standardsGapDemoStore.create({
      tenantId: user.tenantId,
      familyId,
      fromPackId: match.pinnedPackId,
      toPackId: match.latestPackId,
      triggeredBy: user.id,
      results: { diff, aiNarrative },
    });

    return standardsGapDemoStore.update(record.id, {
      status: "complete",
      completedAt: new Date().toISOString(),
    })!;
  }

  getGapAnalysis(user: AuthUser, analysisId: string) {
    const row = standardsGapDemoStore.get(analysisId, user.tenantId);
    if (!row) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Gap analysis not found.",
            status: 404,
          },
        },
        404,
      );
    }
    return row;
  }

  private async listAvailableUpdatesFromSupabase(user: AuthUser) {
    const supabase = getSupabaseForUser(user);
    if (!supabase) {
      return [];
    }

    const { data: selections } = await supabase
      .from("tenant_guidance_selections")
      .select("pack_id, pack_family_id, pinned_pack_id")
      .eq("tenant_id", user.tenantId);

    if (!selections?.length) {
      return [];
    }

    const updates = [];
    for (const row of selections) {
      const familyId = (row.pack_family_id as string) ?? (row.pack_id as string);
      const pinnedPackId = (row.pinned_pack_id as string) ?? (row.pack_id as string);
      const { data: latest } = await supabase
        .from("guidance_packs")
        .select("id, name, version, canonical_slug, changelog")
        .eq("family_id", familyId)
        .eq("is_latest_published", true)
        .maybeSingle();

      if (!latest || latest.id === pinnedPackId) {
        continue;
      }

      const { data: pinned } = await supabase
        .from("guidance_packs")
        .select("version, name")
        .eq("id", pinnedPackId)
        .maybeSingle();

      updates.push({
        familyId,
        packName: latest.name as string,
        canonicalSlug: latest.canonical_slug as string,
        pinnedPackId,
        pinnedVersion: pinned?.version ?? 1,
        latestPackId: latest.id as string,
        latestVersion: latest.version as number,
        changelog: (latest as { changelog?: string }).changelog ?? null,
      });
    }

    return updates;
  }
}
