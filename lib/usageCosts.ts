type CostMapEntry = {
  prompt: number;
  completion: number;
};

const COST_MAP: Record<string, CostMapEntry> = {
  "gpt-4o-mini": { prompt: 0.000003, completion: 0.000006 },
  "o4-mini": { prompt: 0.000003, completion: 0.000006 },
  "claude-3-5-sonnet-20240620": { prompt: 0.000008, completion: 0.000024 },
  "claude-3-5-haiku-20241022": { prompt: 0.000006, completion: 0.000012 },
  "gemini-1.5-pro-latest": { prompt: 0.0000005, completion: 0.0000015 },
  "gemini-1.5-flash-latest": { prompt: 0.00000025, completion: 0.00000075 },
};

export function estimateCostUSD(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = COST_MAP[model];
  if (!rates) return 0;
  return promptTokens * rates.prompt + completionTokens * rates.completion;
}


