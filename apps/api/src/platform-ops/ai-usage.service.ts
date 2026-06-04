import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { usePlatformOpsDemoStore } from "./platform-ops-env";
import {
  computeBilledCostUsd,
  computeProviderCostUsd,
} from "./ai-price-table";
import { aiUsageDemoStore } from "./ai-usage-demo.store";
import type { RecordAiUsageInput } from "./platform-ops.types";
import { TenantPlatformConfigService } from "./tenant-platform-config.service";

@Injectable()
export class AiUsageService {
  constructor(
    @Inject(TenantPlatformConfigService)
    private readonly tenantPlatformConfig: TenantPlatformConfigService,
  ) {}

  async recordEvent(input: RecordAiUsageInput) {
    const providerCostUsd = computeProviderCostUsd(
      input.model,
      input.inputTokens,
      input.outputTokens,
    );
    const config = await this.tenantPlatformConfig.getConfig(input.tenantId);
    const billedCostUsd = computeBilledCostUsd(
      providerCostUsd,
      config?.markupMultiplier,
    );

    const supabase = getSupabaseAdminClient();
    if (usePlatformOpsDemoStore()) {
      return aiUsageDemoStore.record({
        ...input,
        providerCostUsd,
        billedCostUsd,
      });
    }

    if (!supabase) {
      throw new Error("Supabase admin client is not configured");
    }

    const id = randomUUID();
    const { error } = await supabase.from("ai_usage_events").insert({
      id,
      tenant_id: input.tenantId,
      platform_agent_key: input.platformAgentKey,
      prompt_version: input.promptVersion ?? 1,
      feature: input.feature ?? input.platformAgentKey,
      model: input.model,
      provider: input.provider,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      provider_cost_usd: providerCostUsd,
      billed_cost_usd: billedCostUsd,
      latency_ms: input.latencyMs ?? null,
      success: input.success,
      cache_hit: input.cacheHit ?? false,
      json_valid: input.jsonValid ?? null,
      input_char_count: input.inputCharCount ?? null,
      user_content_hash: input.userContentHash ?? null,
      actor_user_id: input.actorUserId ?? null,
      error_code: input.errorCode ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      throw new Error(error.message);
    }

    return { id, providerCostUsd, billedCostUsd };
  }

  async getMtdCostUsd(tenantId: string, now = new Date()): Promise<number> {
    const supabase = getSupabaseAdminClient();
    if (usePlatformOpsDemoStore()) {
      return aiUsageDemoStore.getMtdCostUsd(tenantId, now);
    }

    if (!supabase) {
      throw new Error("Supabase admin client is not configured");
    }

    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    ).toISOString();

    const { data, error } = await supabase
      .from("ai_usage_events")
      .select("provider_cost_usd")
      .eq("tenant_id", tenantId)
      .gte("created_at", monthStart);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).reduce(
      (sum, row) => sum + Number(row.provider_cost_usd ?? 0),
      0,
    );
  }
}
