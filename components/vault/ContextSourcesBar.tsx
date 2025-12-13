"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Folder, User } from "lucide-react";
import type { VaultRef } from "@/types/conversation";

interface ContextSourcesBarProps {
  sources: VaultRef[];
  className?: string;
}

export function ContextSourcesBar({ sources, className = "" }: ContextSourcesBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  const getIcon = (type: VaultRef["type"]) => {
    switch (type) {
      case "bio":
        return <User className="h-3 w-3" />;
      case "folder":
        return <Folder className="h-3 w-3" />;
      case "file":
        return <FileText className="h-3 w-3" />;
    }
  };

  // Show first 2 sources, rest in "more"
  const visibleSources = isExpanded ? sources : sources.slice(0, 2);
  const hiddenCount = sources.length - 2;

  return (
    <div className={`text-xs text-gray-600 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 hover:text-gray-800 transition-colors"
      >
        <span className="font-medium">Used +Vault:</span>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleSources.map((source, index) => (
            <span
              key={source.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700"
            >
              {getIcon(source.type)}
              {source.name}
            </span>
          ))}
          
          {!isExpanded && hiddenCount > 0 && (
            <span className="text-gray-500">
              (+{hiddenCount} more)
            </span>
          )}
        </div>
        
        {sources.length > 2 && (
          isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        )}
      </button>
    </div>
  );
}

