"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { StatsCards } from "@/components/StatsCards";
import { VerificationsTable } from "@/components/VerificationsTable";
import { AiWhMeter } from "@/components/dashboard/AiWhMeter";
import { UsageProjection } from "@/components/dashboard/UsageProjection";
import { UsageHistory } from "@/components/dashboard/UsageHistory";

type Verification = {
  assetId: string;
  similarityScore: number;
  grade: "A" | "B" | "C" | "D";
  serial: string;
  createdAt: string;
};

type Stats = {
  totalVerifications: number;
  uniqueAssetsCount: number;
};

type AiWhData = {
  planId: string;
  allowance: number;
  currentConsumption: number;
  remaining: number;
  usagePercent: number;
  daysRemaining: number;
  thisSession: number;
  dailyBurnRate: number;
  projectedEndOfCycle: number;
  isOverBudget: boolean;
  monthlyAverage: number;
  highestMonth: number;
  highestMonthName: string;
  lowestMonth: number;
  lowestMonthName: string;
};

type TabType = "console" | "billing";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("console");
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVerifications: 0,
    uniqueAssetsCount: 0,
  });
  const [aiWhData, setAiWhData] = useState<AiWhData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiWhLoading, setAiWhLoading] = useState(true);

  const fetchVerifications = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/voice-lock/verifications?userId=${currentUser.uid}`
      );
      const data = await response.json();
      setVerifications(data.verifications || []);
      setStats(data.stats || { totalVerifications: 0, uniqueAssetsCount: 0 });
    } catch (error) {
      console.error("Error fetching verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiWhData = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `/api/usage/aiwh?userId=${currentUser.uid}`
      );
      if (response.ok) {
        const data = await response.json();
        setAiWhData(data);
      }
    } catch (error) {
      console.error("Error fetching aiWh data:", error);
    } finally {
      setAiWhLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchVerifications();
      fetchAiWhData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Poll for aiWh updates every 30 seconds
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      fetchAiWhData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-8 text-emerald-400">
            Dashboard
          </h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-slate-800">
            <button
              onClick={() => setActiveTab("console")}
              className={`pb-3 px-4 font-semibold transition ${
                activeTab === "console"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              AI Service Console
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`pb-3 px-4 font-semibold transition ${
                activeTab === "billing"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Usage & Billing
            </button>
          </div>

          {activeTab === "console" && (
            <>
              {loading ? (
                <div className="text-center py-12 text-slate-400">Loading...</div>
              ) : (
                <>
                  <StatsCards
                    totalVerifications={stats.totalVerifications}
                    uniqueAssetsCount={stats.uniqueAssetsCount}
                  />
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-slate-200">
                      Recent Verifications
                    </h2>
                    <VerificationsTable verifications={verifications} />
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "billing" && (
            <>
              {aiWhLoading ? (
                <div className="text-center py-12 text-slate-400">Loading usage data...</div>
              ) : aiWhData ? (
                <>
                  <AiWhMeter
                    planId={aiWhData.planId}
                    allowance={aiWhData.allowance}
                    currentConsumption={aiWhData.currentConsumption}
                    remaining={aiWhData.remaining}
                    usagePercent={aiWhData.usagePercent}
                    daysRemaining={aiWhData.daysRemaining}
                    thisSession={aiWhData.thisSession}
                    isOverBudget={aiWhData.isOverBudget}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <UsageProjection
                      dailyBurnRate={aiWhData.dailyBurnRate}
                      projectedEndOfCycle={aiWhData.projectedEndOfCycle}
                      isOverBudget={aiWhData.isOverBudget}
                    />
                    <UsageHistory
                      monthlyAverage={aiWhData.monthlyAverage}
                      highestMonth={aiWhData.highestMonth}
                      highestMonthName={aiWhData.highestMonthName}
                      lowestMonth={aiWhData.lowestMonth}
                      lowestMonthName={aiWhData.lowestMonthName}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Unable to load usage data
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

