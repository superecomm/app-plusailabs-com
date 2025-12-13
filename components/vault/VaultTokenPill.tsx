"use client";

import { X } from "lucide-react";

interface VaultTokenPillProps {
  token: string;
  onRemove?: () => void;
  className?: string;
}

export function VaultTokenPill({ token, onRemove, className = "" }: VaultTokenPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-sm font-medium ${className}`}
      contentEditable={false}
      suppressContentEditableWarning
    >
      {token}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:bg-blue-200 rounded-sm p-0.5 transition-colors"
          aria-label={`Remove ${token}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

