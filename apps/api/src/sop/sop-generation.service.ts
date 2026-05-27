import { Injectable } from "@nestjs/common";
import {
  buildMockDraft,
  mergeGaps,
  normalizeGeneratedDraft,
  type GenerateSopInput,
  type GenerateSopResult,
} from "./sop.types";

const MODEL = "claude-sonnet-4-6";

@Injectable()
export class SopGenerationService {
  async generate(input: GenerateSopInput): Promise<GenerateSopResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      const draft = normalizeGeneratedDraft(buildMockDraft(input));
      const gaps = mergeGaps(draft);
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
        const response = await this.callClaude(apiKey, input);
        const draft = normalizeGeneratedDraft(JSON.parse(response.text));
        const gaps = mergeGaps(draft);
        return {
          draft,
          gaps,
          model: MODEL,
          tokensUsed: response.tokensUsed,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Generation failed");
      }
    }

    throw lastError ?? new Error("SOP generation failed");
  }

  private async callClaude(apiKey: string, input: GenerateSopInput) {
    const systemPrompt = `You are Aquilens, an institutional process documentation assistant.
Return strictly valid JSON with this shape:
{
  "name": string,
  "description": string,
  "purpose": string,
  "risk_rating": "high" | "medium" | "low",
  "risk_notes": string,
  "who_it_affects": string[],
  "governance_controls": [{ "name": string, "type": "preventive"|"detective"|"corrective", "owner": string }],
  "steps": [{
    "step_number": number,
    "title": string,
    "description": string,
    "responsible_role": string,
    "inputs": string,
    "outputs": string,
    "controls": string,
    "step_type": "manual" | "approval",
    "evidence_required": boolean
  }],
  "gaps": [{ "field": string, "severity": "required"|"recommended", "message": string }]
}
Include at least one required gap for owner assignment and one required gap asking the user to confirm risk rating.
Do not wrap JSON in markdown fences.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Tenant context: ${input.tenantContext ?? "Unknown institution"}`,
              },
              {
                type: "text",
                text: `Function ID: ${input.functionId}\nProcess area ID: ${input.processAreaId}`,
              },
              {
                type: "text",
                text: `Process description:\n${input.description}`,
              },
            ],
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
      tokensUsed:
        (payload.usage?.input_tokens ?? 0) + (payload.usage?.output_tokens ?? 0),
    };
  }
}
