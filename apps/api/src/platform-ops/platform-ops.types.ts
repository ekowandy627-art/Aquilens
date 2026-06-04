export const WALL_ERROR_CODES = [
  "AI_BUDGET_UNSET",
  "AI_BUDGET_EXCEEDED",
  "FEATURE_DISABLED",
  "TENANT_SUSPENDED",
] as const;

export type WallErrorCode = (typeof WALL_ERROR_CODES)[number];

export type PlatformErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    supportable?: boolean;
  };
};

export type RecordAiUsageInput = {
  tenantId: string;
  platformAgentKey: string;
  promptVersion?: number;
  feature?: string;
  model: string;
  provider: "openai" | "anthropic";
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  success: boolean;
  cacheHit?: boolean;
  jsonValid?: boolean;
  inputCharCount?: number;
  userContentHash?: string;
  actorUserId?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
};

export type TenantPlatformConfigRecord = {
  tenantId: string;
  lifecycleState: "trial" | "active" | "suspended" | "offboarding";
  aiMonthlyBudgetUsd: number | null;
  markupMultiplier: number | null;
  featureFlags: Record<string, boolean>;
  modelRouting: Record<string, string>;
  planLabel?: string;
  notes?: string;
};

export type PlatformAgentPrompt = {
  agentKey: string;
  version: number;
  systemPrompt: string;
  userPromptTemplate: string;
};

export const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  incidents_enabled: true,
  training_assessments_enabled: true,
  recurring_controls_enabled: true,
  sop_compose_enabled: true,
  siai_enabled: true,
};

export const FEATURE_FLAG_BY_AGENT: Record<string, string> = {
  sop_generate: "sop_compose_enabled",
  sop_transcribe: "sop_compose_enabled",
  sop_compose_align: "sop_compose_enabled",
  standards_gap_analysis: "sop_compose_enabled",
  training_questions: "training_assessments_enabled",
};
