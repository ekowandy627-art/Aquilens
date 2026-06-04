import { Injectable } from "@nestjs/common";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { usePlatformOpsDemoStore } from "./platform-ops-env";
import type { PlatformAgentPrompt } from "./platform-ops.types";

const FALLBACK_PROMPTS: Record<string, PlatformAgentPrompt> = {
  sop_generate: {
    agentKey: "sop_generate",
    version: 1,
    systemPrompt: `You are Aquilens, an institutional process documentation assistant.
Return strictly valid JSON with SOP draft fields.
Do not wrap JSON in markdown fences.`,
    userPromptTemplate:
      "Tenant context: {{tenantContext}}\nFunction ID: {{functionId}}\nProcess area ID: {{processAreaId}}\nProcess description:\n{{description}}",
  },
  sop_transcribe: {
    agentKey: "sop_transcribe",
    version: 1,
    systemPrompt: "Transcribe the provided audio accurately.",
    userPromptTemplate: "{{audioReference}}",
  },
  sop_compose_align: {
    agentKey: "sop_compose_align",
    version: 1,
    systemPrompt:
      "You align SOP drafts with selected guidance pack requirements. Output valid JSON.",
    userPromptTemplate: "Draft: {{draft}}. Packs: {{packIds}}",
  },
  standards_gap_analysis: {
    agentKey: "standards_gap_analysis",
    version: 1,
    systemPrompt:
      "Analyze standards requirement diffs and produce structured gap recommendations. Output valid JSON.",
    userPromptTemplate:
      "From pack {{fromPackId}} to {{toPackId}}. Diff: {{diff}}",
  },
  training_questions: {
    agentKey: "training_questions",
    version: 1,
    systemPrompt:
      "Generate training assessment questions from SOP content. Output valid JSON.",
    userPromptTemplate: "SOP: {{sopContent}}",
  },
};

@Injectable()
export class PlatformAiAgentRegistryService {
  async getPrompt(agentKey: string): Promise<PlatformAgentPrompt> {
    const supabase = getSupabaseAdminClient();
    if (usePlatformOpsDemoStore()) {
      return FALLBACK_PROMPTS[agentKey] ?? FALLBACK_PROMPTS.sop_generate;
    }

    if (!supabase) {
      throw new Error("Supabase admin client is not configured");
    }

    const { data: agent } = await supabase
      .from("platform_ai_agents")
      .select("agent_key, current_prompt_version_id, default_model")
      .eq("agent_key", agentKey)
      .maybeSingle<{
        agent_key: string;
        current_prompt_version_id: string | null;
        default_model: string;
      }>();

    if (!agent?.current_prompt_version_id) {
      return FALLBACK_PROMPTS[agentKey] ?? FALLBACK_PROMPTS.sop_generate;
    }

    const { data: version } = await supabase
      .from("platform_ai_agent_prompt_versions")
      .select("agent_key, version, system_prompt, user_prompt_template")
      .eq("id", agent.current_prompt_version_id)
      .maybeSingle<{
        agent_key: string;
        version: number;
        system_prompt: string;
        user_prompt_template: string;
      }>();

    if (!version) {
      return FALLBACK_PROMPTS[agentKey] ?? FALLBACK_PROMPTS.sop_generate;
    }

    return {
      agentKey: version.agent_key,
      version: version.version,
      systemPrompt: version.system_prompt,
      userPromptTemplate: version.user_prompt_template,
    };
  }

  async getDefaultModel(agentKey: string): Promise<string> {
    const supabase = getSupabaseAdminClient();
    if (usePlatformOpsDemoStore()) {
      return agentKey === "sop_transcribe" ? "whisper-1" : "claude-sonnet-4-6";
    }

    if (!supabase) {
      throw new Error("Supabase admin client is not configured");
    }

    const { data } = await supabase
      .from("platform_ai_agents")
      .select("default_model")
      .eq("agent_key", agentKey)
      .maybeSingle<{ default_model: string }>();

    return data?.default_model ?? "claude-sonnet-4-6";
  }

  renderUserPrompt(template: string, vars: Record<string, string>) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
  }
}
