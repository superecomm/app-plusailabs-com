import { getAdminFirestore } from "@/lib/firebase/admin";
import type { UsageLog, UsageSummary, UsageProvider } from "@/types/usage";
import { estimateCostUSD } from "./usageCosts";
import { FreeTrialStatus, UserSubscription } from "@/lib/data/types";

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

// Default limits
const FREE_TRIAL_REQUEST_CAP = 25; // small trial
const FREE_PLAN_DAILY_TOKEN_CAP = 50000;
const PLUS_PLAN_DAILY_TOKEN_CAP = 1000000;

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
        dailyTokenLimit: FREE_PLAN_DAILY_TOKEN_CAP,
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

      // Free trial tracking
      if (!summary.freeTrial) {
          summary.freeTrial = {
              totalRequestsUsed: 0,
              totalRequestsCap: FREE_TRIAL_REQUEST_CAP,
              isLocked: false
          };
      }
      
      if (!summary.freeTrial.isLocked) {
           summary.freeTrial.totalRequestsUsed += 1;
      }

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

export interface UsageCheckResult {
    allowed: boolean;
    reason?: string;
    code?: string;
    usagePercent?: number; // 0-100
    daysRemaining?: number;
}

export async function checkUsageAllowed(userId: string): Promise<UsageCheckResult> {
  if (userId === "anonymous") return { allowed: true };

  const firestore = assertAdminDb();
  if (!firestore) return { allowed: true };

  // 1. Fetch Subscription Plan
  let plan = "free";
  const subRef = firestore.collection("subscriptions").doc(userId);
  const subSnap = await subRef.get();
  if (subSnap.exists) {
      const subData = subSnap.data() as UserSubscription;
      if (subData.status === "active" || subData.status === "trialing") {
          plan = subData.planId; // "plus", "super", etc.
      }
  }

  // 2. Fetch Usage Summary
  const summary = await getUsageSummary(userId);
  
  // 3. Check Free Trial Limits (Only for Free Plan)
  if (plan === "free") {
      const trial = summary.freeTrial || { totalRequestsUsed: 0, totalRequestsCap: FREE_TRIAL_REQUEST_CAP, isLocked: false };
      
      // If already marked locked, or usage exceeds cap
      if (trial.isLocked || trial.totalRequestsUsed >= trial.totalRequestsCap) {
          // Ensure we persist the lock state if not set
          if (!trial.isLocked) {
              const summaryRef = firestore.collection("usageSummary").doc(userId);
              await summaryRef.update({ 
                  "freeTrial.isLocked": true,
                  "freeTrial.lockedAt": Date.now() 
              }).catch(console.error);
          }
          
          return { 
              allowed: false, 
              reason: "You’ve reached the free trial limit for +AI.", 
              code: "FREE_TRIAL_EXHAUSTED" 
          };
      }
  }

  // 4. Check Daily/Monthly Safety Caps (For all users, higher for paid)
  const dailyKey = getDailyKey();
  const monthlyKey = getMonthlyKey();
  
  const dailyTokens = summary.daily[dailyKey]?.tokens ?? 0;
  // Dynamic limit based on plan
  const dailyLimit = (plan === "plus" || plan === "super") ? PLUS_PLAN_DAILY_TOKEN_CAP : FREE_PLAN_DAILY_TOKEN_CAP;

  if (dailyTokens >= dailyLimit) {
    return { allowed: false, reason: "Daily token limit reached", code: "DAILY_LIMIT" };
  }

  const monthlyCost = summary.monthly[monthlyKey]?.costUSD ?? 0;
  if (monthlyCost >= summary.monthlyCostLimitUSD) {
    return { 
        allowed: false, 
        reason: "Monthly usage limit reached",
        code: "MONTHLY_LIMIT"
    };
  }

  // 5. Usage warning logic (Soft limits)
  // Check if close to monthly limit (e.g. > 80%)
  const usagePercent = (monthlyCost / summary.monthlyCostLimitUSD) * 100;
  
  return { 
      allowed: true,
      usagePercent 
  };
}
