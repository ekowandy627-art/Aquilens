/** Provider list prices in USD per 1K tokens (input / output). Updated manually as prices change. */
const MODEL_PRICES: Record<string, { inputPer1k: number; outputPer1k: number }> = {
  "claude-sonnet-4-6": { inputPer1k: 0.003, outputPer1k: 0.015 },
  "claude-sonnet-4-20250514": { inputPer1k: 0.003, outputPer1k: 0.015 },
  "gpt-4o-mini-transcribe": { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  "whisper-1": { inputPer1k: 0.006, outputPer1k: 0 },
  "mock-claude-sonnet-4-6": { inputPer1k: 0, outputPer1k: 0 },
};

export function computeProviderCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const prices = MODEL_PRICES[model] ?? { inputPer1k: 0.003, outputPer1k: 0.015 };
  const cost =
    (inputTokens / 1000) * prices.inputPer1k +
    (outputTokens / 1000) * prices.outputPer1k;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export function computeBilledCostUsd(
  providerCostUsd: number,
  markupMultiplier: number | null | undefined,
): number | null {
  if (markupMultiplier == null) {
    return null;
  }
  return Math.round(providerCostUsd * markupMultiplier * 1_000_000) / 1_000_000;
}
