"use client";

interface UsageHistoryProps {
  monthlyAverage: number;
  highestMonth: number;
  highestMonthName: string;
  lowestMonth: number;
  lowestMonthName: string;
}

export function UsageHistory({
  monthlyAverage,
  highestMonth,
  highestMonthName,
  lowestMonth,
  lowestMonthName,
}: UsageHistoryProps) {
  return (
    <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">
        Usage History
      </h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Monthly Average (Last 6 mo)</span>
          <span className="text-white font-semibold">
            {monthlyAverage.toFixed(2)} aiWh
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Highest Month</span>
          <span className="text-white font-semibold">
            {highestMonth.toFixed(2)} aiWh {highestMonthName && `(${highestMonthName})`}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
          <span className="text-slate-400 text-sm">Lowest Month</span>
          <span className="text-white font-semibold">
            {lowestMonth.toFixed(2)} aiWh {lowestMonthName && `(${lowestMonthName})`}
          </span>
        </div>
      </div>
    </div>
  );
}

