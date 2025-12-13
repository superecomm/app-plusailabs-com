"use client";

import { RefreshCcw, X } from "lucide-react";

interface StallActionsBarProps {
  onRetry: () => void;
  onCancel: () => void;
  theme?: "light" | "dark";
}

export function StallActionsBar({ onRetry, onCancel, theme = "light" }: StallActionsBarProps) {
  const isDark = theme === "dark";
  
  return (
    <div
      className={`flex items-center justify-center gap-3 px-4 py-3 border-t ${
        isDark
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-gray-50 border-gray-200 text-gray-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
        </div>
        <span className="text-sm font-medium">
          Response stalled
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onRetry}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isDark
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          aria-label="Retry streaming"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Retry
        </button>
        
        <button
          onClick={onCancel}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isDark
              ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
              : "bg-gray-200 hover:bg-gray-300 text-gray-700"
          }`}
          aria-label="Cancel request"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

