export type UsageProvider = "openai" | "anthropic" | "google";

export type UsageLog = {
  id?: string;
  userId: string;
  provider: UsageProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUSD: number;
  createdAt: number;
};

export type UsageSummary = {
  userId: string;
  daily: Record<string, { tokens: number; costUSD: number }>;
  monthly: Record<string, { tokens: number; costUSD: number }>;
  dailyTokenLimit: number;
  monthlyCostLimitUSD: number;
  freeTrial?: {
    totalRequestsUsed: number;
    totalRequestsCap: number;
    isLocked: boolean;
    lockedAt?: number;
  };
  updatedAt: number;
};
