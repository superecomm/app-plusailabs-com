import { db } from "@/lib/firebase/client";
import { collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { UsageLog, UsageSummary, UsageProvider } from "@/types/usage";
import { estimateCostUSD } from "./usageCosts";

function assertDb() {
  // On the server (API routes), the client Firebase SDK is not initialized.
  // When Firestore isn't available, usage tracking should be a no-op rather
  // than throwing and breaking LLM calls.
  if (!db) {
    if (typeof window === "undefined") {
      return undefined;
    }
    throw new Error("Firebase client is not initialized. Set NEXT_PUBLIC_FIREBASE_* env vars.");
  }
  return db;
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
  const firestore = assertDb();
  // If Firestore is not available (e.g. on server without client config),
  // skip logging but don't block the request.
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

  const logsRef = collection(firestore, "usageLogs");
  await setDoc(doc(logsRef), { ...usageLog, createdAt: serverTimestamp() });

  const summaryRef = doc(firestore, "usageSummary", params.userId);
  const summarySnap = await getDoc(summaryRef);
  const defaultSummary: UsageSummary = {
    userId: params.userId,
    daily: {},
    monthly: {},
    dailyTokenLimit: 100000,
    monthlyCostLimitUSD: 10,
    updatedAt: now.getTime(),
  };
  const summary = summarySnap.exists() ? (summarySnap.data() as UsageSummary) : defaultSummary;

  const dailyBucket = summary.daily[dailyKey] || { tokens: 0, costUSD: 0 };
  const monthlyBucket = summary.monthly[monthlyKey] || { tokens: 0, costUSD: 0 };

  dailyBucket.tokens += totalTokens;
  dailyBucket.costUSD += costUSD;
  monthlyBucket.tokens += totalTokens;
  monthlyBucket.costUSD += costUSD;

  summary.daily[dailyKey] = dailyBucket;
  summary.monthly[monthlyKey] = monthlyBucket;
  summary.updatedAt = now.getTime();

  await setDoc(summaryRef, summary);
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const firestore = assertDb();
  if (!firestore) {
    // No Firestore available; return a permissive default so usage checks pass.
    return {
      userId,
      daily: {},
      monthly: {},
      dailyTokenLimit: 100000,
      monthlyCostLimitUSD: 10,
      updatedAt: Date.now(),
    };
  }
  const summaryRef = doc(firestore, "usageSummary", userId);
  const snap = await getDoc(summaryRef);
  if (!snap.exists()) {
    const defaultSummary: UsageSummary = {
      userId,
      daily: {},
      monthly: {},
      dailyTokenLimit: 100000,
      monthlyCostLimitUSD: 10,
      updatedAt: Date.now(),
    };
    await setDoc(summaryRef, defaultSummary);
    return defaultSummary;
  }
  return snap.data() as UsageSummary;
}

export async function checkUsageAllowed(userId: string): Promise<{ allowed: boolean; reason?: string }> {
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


