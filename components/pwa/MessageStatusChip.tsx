"use client";

import { Clock, Send, AlertCircle } from "lucide-react";

interface MessageStatusChipProps {
  status: 'pending' | 'sending' | 'failed';
  onRetry?: () => void;
}

export function MessageStatusChip({ status, onRetry }: MessageStatusChipProps) {
  if (status === 'pending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-xs text-yellow-400">
        <Clock className="w-3 h-3" />
        <span>Queued</span>
      </div>
    );
  }

  if (status === 'sending') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">
        <Send className="w-3 h-3 animate-pulse" />
        <span>Sending...</span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <AlertCircle className="w-3 h-3" />
        <span>Failed - Retry</span>
      </button>
    );
  }

  return null;
}

