import { Inject, Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { AiQuotaService } from "../platform-ops/ai-quota.service";
import { AiUsageService } from "../platform-ops/ai-usage.service";
import { PlatformAiAgentRegistryService } from "../platform-ops/platform-ai-agent-registry.service";
import {
  buildMockDraft,
  mergeGaps,
  normalizeGeneratedDraft,
  type GenerateSopInput,
  type GenerateSopResult,
} from "./sop.types";

const AGENT_KEY = "sop_generate";

@Injectable()
export class SopGenerationService {
  constructor(
    @Inject(AiQuotaService) private readonly aiQuota: AiQuotaService,
    @Inject(AiUsageService) private readonly aiUsage: AiUsageService,
    @Inject(PlatformAiAgentRegistryService)
    private readonly agentRegistry: PlatformAiAgentRegistryService,
  ) {}

  async generate(input: GenerateSopInput): Promise<GenerateSopResult> {
    if (input.tenantId) {
      await this.aiQuota.assertAgentAllowed(input.tenantId, AGENT_KEY);
    }

    const prompt = await this.agentRegistry.getPrompt(AGENT_KEY);
    const model = await this.agentRegistry.getDefaultModel(AGENT_KEY);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const started = Date.now();
    const inputCharCount = input.description.length;
    const userContentHash = createHash("sha256")
      .update(input.description)
      .digest("hex")
      .slice(0, 16);

    if (!apiKey) {
      const draft = normalizeGeneratedDraft(buildMockDraft(input));
      const gaps = mergeGaps(draft);
      if (input.tenantId) {
        await this.aiUsage.recordEvent({
          tenantId: input.tenantId,
          platformAgentKey: AGENT_KEY,
          promptVersion: prompt.version,
          model: "mock-claude-sonnet-4-6",
          provider: "anthropic",
          inputTokens: 0,
          outputTokens: 0,
          latencyMs: Date.now() - started,
          success: true,
          cacheHit: true,
          jsonValid: true,
          inputCharCount,
          userContentHash,
          actorUserId: input.actorUserId,
        });
      }
      return {
        draft,
        gaps,
        model: "mock-claude-sonnet-4-6",
        tokensUsed: 0,
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.callClaude(apiKey, input, prompt.systemPrompt, model);
        const draft = normalizeGeneratedDraft(JSON.parse(response.text));
        const gaps = mergeGaps(draft);
        if (input.tenantId) {
          await this.aiUsage.recordEvent({
            tenantId: input.tenantId,
            platformAgentKey: AGENT_KEY,
            promptVersion: prompt.version,
            model,
            provider: "anthropic",
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            latencyMs: Date.now() - started,
            success: true,
            jsonValid: true,
            inputCharCount,
            userContentHash,
            actorUserId: input.actorUserId,
          });
        }
        return {
          draft,
          gaps,
          model,
          tokensUsed: response.inputTokens + response.outputTokens,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Generation failed");
        if (input.tenantId) {
          await this.aiUsage.recordEvent({
            tenantId: input.tenantId,
            platformAgentKey: AGENT_KEY,
            promptVersion: prompt.version,
            model,
            provider: "anthropic",
            inputTokens: 0,
            outputTokens: 0,
            latencyMs: Date.now() - started,
            success: false,
            jsonValid: false,
            inputCharCount,
            userContentHash,
            actorUserId: input.actorUserId,
            errorCode: "GENERATION_FAILED",
          });
        }
      }
    }

    throw lastError ?? new Error("SOP generation failed");
  }

  private async callClaude(
    apiKey: string,
    input: GenerateSopInput,
    systemPrompt: string,
    model: string,
  ) {
    const userPrompt = this.agentRegistry.renderUserPrompt(
      (await this.agentRegistry.getPrompt(AGENT_KEY)).userPromptTemplate ||
        `Process description:\n{{description}}`,
      {
        tenantContext: input.tenantContext ?? "Unknown institution",
        functionId: input.functionId,
        processAreaId: input.processAreaId,
        description: input.description,
      },
    );

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: userPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Claude API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const text = payload.content?.find((block) => block.type === "text")?.text;
    if (!text) {
      throw new Error("Claude API returned no text content");
    }

    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    return {
      text: cleaned,
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    };
  }
}
