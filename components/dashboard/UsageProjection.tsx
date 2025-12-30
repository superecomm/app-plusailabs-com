"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";

interface UsageProjectionProps {
  dailyBurnRate: number;
  projectedEndOfCycle: number;
  isOverBudget: boolean;
}

export function UsageProjection({
  dailyBurnRate,
  projectedEndOfCycle,
  isOverBudget,
}: UsageProjectionProps) {
  return (
    <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        This Month Projection
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Estimated daily burn</span>
          <span className="text-white font-semibold">
            {dailyBurnRate.toFixed(2)} aiWh/day
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Projected end-of-cycle</span>
          <span className="text-white font-semibold">
            {projectedEndOfCycle.toFixed(2)} aiWh
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <span className="text-slate-400 text-sm">Status</span>
          <div className="flex items-center gap-2">
            {isOverBudget ? (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 font-semibold">Over budget</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">On track</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

