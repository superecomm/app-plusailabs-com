import { getAdminFirestore } from "@/lib/firebase/admin";
import type { UsageLog, UsageSummary, UsageProvider } from "@/types/usage";
import { estimateCostUSD } from "./usageCosts";

function assertAdminDb() {
  try {
    return getAdminFirestore();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firebase Admin unavailable, skipping usage tracking", error);
    }
    return undefined;
  }
}

function getDailyKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getMonthlyKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export async function logUsage(params: {
  userId: string;
  provider: UsageProvider;
  model: string;
  promptTokens: number;
  completionTokens: number;
}) {
  const firestore = assertAdminDb();
  if (!firestore) return;

  const totalTokens = params.promptTokens + params.completionTokens;
  const costUSD = estimateCostUSD(params.model, params.promptTokens, params.completionTokens);
  const now = new Date();
  const dailyKey = getDailyKey(now);
  const monthlyKey = getMonthlyKey(now);

  const usageLog: UsageLog = {
    userId: params.userId,
    provider: params.provider,
    model: params.model,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    totalTokens,
    costUSD,
    createdAt: now.getTime(),
  };

  try {
    const logsRef = firestore.collection("usageLogs");
    await logsRef.add(usageLog);

    const summaryRef = firestore.collection("usageSummary").doc(params.userId);
    
    await firestore.runTransaction(async (transaction) => {
      const summaryDoc = await transaction.get(summaryRef);
      
      const defaultSummary: UsageSummary = {
        userId: params.userId,
        daily: {},
        monthly: {},
        dailyTokenLimit: 100000,
        monthlyCostLimitUSD: 10,
        updatedAt: now.getTime(),
      };

      const summary = summaryDoc.exists ? (summaryDoc.data() as UsageSummary) : defaultSummary;

      const dailyBucket = summary.daily[dailyKey] || { tokens: 0, costUSD: 0 };
      const monthlyBucket = summary.monthly[monthlyKey] || { tokens: 0, costUSD: 0 };

      dailyBucket.tokens += totalTokens;
      dailyBucket.costUSD += costUSD;
      monthlyBucket.tokens += totalTokens;
      monthlyBucket.costUSD += costUSD;

      summary.daily[dailyKey] = dailyBucket;
      summary.monthly[monthlyKey] = monthlyBucket;
      summary.updatedAt = now.getTime();

      transaction.set(summaryRef, summary);
    });
  } catch (error) {
    console.error("Error logging usage:", error);
  }
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const firestore = assertAdminDb();
  if (!firestore) {
    return {
      userId,
      daily: {},
      monthly: {},
      dailyTokenLimit: 100000,
      monthlyCostLimitUSD: 10,
      updatedAt: Date.now(),
    };
  }

  const summaryRef = firestore.collection("usageSummary").doc(userId);
  const snap = await summaryRef.get();

  if (!snap.exists) {
    const defaultSummary: UsageSummary = {
      userId,
      daily: {},
      monthly: {},
      dailyTokenLimit: 100000,
      monthlyCostLimitUSD: 10,
      updatedAt: Date.now(),
    };
    // Don't wait for write, just return default
    summaryRef.set(defaultSummary).catch(console.error);
    return defaultSummary;
  }

  return snap.data() as UsageSummary;
}

export async function checkUsageAllowed(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  // Anonymous users bypass strict checks for now, or you can block them
  if (userId === "anonymous") return { allowed: true };

  const summary = await getUsageSummary(userId);
  const dailyKey = getDailyKey();
  const monthlyKey = getMonthlyKey();

  const dailyTokens = summary.daily[dailyKey]?.tokens ?? 0;
  if (dailyTokens >= summary.dailyTokenLimit) {
    return { allowed: false, reason: "Daily token limit reached" };
  }

  const monthlyCost = summary.monthly[monthlyKey]?.costUSD ?? 0;
  if (monthlyCost >= summary.monthlyCostLimitUSD) {
    return { allowed: false, reason: "Monthly usage limit reached" };
  }

  return { allowed: true };
}
