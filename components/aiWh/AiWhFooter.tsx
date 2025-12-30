"use client";

import { Zap } from "lucide-react";

interface AiWhFooterProps {
  modelName?: string;
  tokensIn?: number;
  tokensOut?: number;
}

export function AiWhFooter({
  modelName = "GPT-5.1",
  tokensIn,
  tokensOut,
}: AiWhFooterProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-gray-600 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-300">
      <div className="flex items-center gap-1">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[9px] font-bold text-white dark:bg-gray-100 dark:text-gray-900">
          W
        </span>
        <span className="uppercase tracking-[0.12em]">aiWh</span>
      </div>

      <span className="h-3 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="flex items-center gap-1">
        <Zap className="h-3 w-3 opacity-70" />
        <span className="opacity-80">
          est. usage {/* placeholder; real values wired later */}
        </span>
      </div>

      {typeof tokensIn === "number" || typeof tokensOut === "number" ? (
        <span className="text-[9px] opacity-70">
          in {tokensIn ?? "–"} • out {tokensOut ?? "–"}
        </span>
      ) : null}

      <span className="text-[9px] uppercase tracking-[0.16em] opacity-60">
        {modelName}
      </span>
    </div>
  );
}
