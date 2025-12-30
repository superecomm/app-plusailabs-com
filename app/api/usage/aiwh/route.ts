import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getUsageSummary } from "@/lib/usageService";
import { usageToAiWh, getPlanAiWhAllowance } from "@/lib/aiWhConverter";
import type { UserSubscription } from "@/lib/data/types";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const firestore = getAdminFirestore();
    if (!firestore) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Get subscription plan
    let planId = "free";
    const subRef = firestore.collection("subscriptions").doc(userId);
    const subSnap = await subRef.get();
    if (subSnap.exists) {
      const subData = subSnap.data() as UserSubscription;
      if (subData.status === "active" || subData.status === "trialing") {
        planId = subData.planId || "free";
      }
    }

    // Get usage summary
    const summary = await getUsageSummary(userId);

    // Get current month key
    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM
    const currentDayKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Calculate current month consumption
    const currentMonthUsage = summary.monthly[currentMonthKey] || { tokens: 0, costUSD: 0 };
    const currentMonthAiWh = usageToAiWh(currentMonthUsage.tokens, currentMonthUsage.costUSD);

    // Calculate today's consumption (this session)
    const todayUsage = summary.daily[currentDayKey] || { tokens: 0, costUSD: 0 };
    const todayAiWh = usageToAiWh(todayUsage.tokens, todayUsage.costUSD);

    // Get plan allowance
    const allowance = getPlanAiWhAllowance(planId);
    const remaining = Math.max(0, allowance - currentMonthAiWh);
    const usagePercent = (currentMonthAiWh / allowance) * 100;

    // Calculate days remaining in billing cycle
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    // Calculate daily burn rate and projection
    const dailyBurnRate = daysElapsed > 0 ? currentMonthAiWh / daysElapsed : 0;
    const projectedEndOfCycle = dailyBurnRate * daysInMonth;

    // Calculate historical averages (last 6 months)
    const monthlyKeys = Object.keys(summary.monthly).sort().slice(-6);
    const monthlyValues = monthlyKeys.map(key => {
      const monthUsage = summary.monthly[key];
      return usageToAiWh(monthUsage.tokens, monthUsage.costUSD);
    });

    const monthlyAverage = monthlyValues.length > 0
      ? monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
      : 0;

    const highestMonth = monthlyValues.length > 0 ? Math.max(...monthlyValues) : 0;
    const lowestMonth = monthlyValues.length > 0 ? Math.min(...monthlyValues) : 0;
    
    // Find month names for highest/lowest
    let highestMonthName = "";
    let lowestMonthName = "";
    if (monthlyKeys.length > 0) {
      const highestIndex = monthlyValues.indexOf(highestMonth);
      const lowestIndex = monthlyValues.indexOf(lowestMonth);
      if (highestIndex >= 0) {
        const date = new Date(monthlyKeys[highestIndex] + "-01");
        highestMonthName = date.toLocaleString("default", { month: "long" });
      }
      if (lowestIndex >= 0) {
        const date = new Date(monthlyKeys[lowestIndex] + "-01");
        lowestMonthName = date.toLocaleString("default", { month: "long" });
      }
    }

    return NextResponse.json({
      planId,
      allowance,
      currentConsumption: currentMonthAiWh,
      remaining,
      usagePercent,
      daysRemaining,
      thisSession: todayAiWh,
      dailyBurnRate,
      projectedEndOfCycle,
      isOverBudget: projectedEndOfCycle > allowance,
      monthlyAverage,
      highestMonth,
      highestMonthName,
      lowestMonth,
      lowestMonthName,
    });
  } catch (error) {
    console.error("Error fetching aiWh data:", error);
    return NextResponse.json(
      { error: "Failed to fetch aiWh data" },
      { status: 500 }
    );
  }
}

