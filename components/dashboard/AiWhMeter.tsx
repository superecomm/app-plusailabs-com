"use client";

import { Zap, AlertTriangle } from "lucide-react";

interface AiWhMeterProps {
  planId: string;
  allowance: number;
  currentConsumption: number;
  remaining: number;
  usagePercent: number;
  daysRemaining: number;
  thisSession: number;
  isOverBudget?: boolean;
}

const planNames: Record<string, string> = {
  free: "Free AI",
  plus: "+AI",
  super: "Super +AI",
  family: "Family Plan",
};

export function AiWhMeter({
  planId,
  allowance,
  currentConsumption,
  remaining,
  usagePercent,
  daysRemaining,
  thisSession,
  isOverBudget,
}: AiWhMeterProps) {
  const planName = planNames[planId] || "Free AI";

  return (
    <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-emerald-400">AI Watt Meter</h2>
        </div>
        <span className="text-sm text-slate-400">{planName}</span>
      </div>

      <div className="space-y-4">
        {/* Current Consumption */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-bold text-white">
              {currentConsumption.toFixed(2)} aiWh
            </span>
            <span className="text-slate-400 text-sm">
              of {allowance} aiWh included allowance
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                usagePercent >= 100
                  ? "bg-red-500"
                  : usagePercent >= 80
                  ? "bg-yellow-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {remaining.toFixed(2)} aiWh remaining
            </span>
            <span className="text-slate-400">{daysRemaining} days remaining</span>
          </div>
        </div>

        {/* This Session */}
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">This Session</span>
            <span className="text-emerald-400 font-semibold">
              +{thisSession.toFixed(3)} aiWh
            </span>
          </div>
        </div>

        {/* Over Budget Warning */}
        {isOverBudget && (
          <div className="flex items-center gap-2 text-yellow-400 text-sm pt-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Projected usage exceeds monthly allowance</span>
          </div>
        )}
      </div>
    </div>
  );
}

