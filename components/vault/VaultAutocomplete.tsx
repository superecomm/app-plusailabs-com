"use client";

import { FileText, Folder, User } from "lucide-react";
import type { VaultItem } from "@/hooks/useVaultAutocomplete";

interface VaultAutocompleteProps {
  items: VaultItem[];
  selectedIndex: number;
  position: { x: number; y: number };
  onSelect: (item: VaultItem) => void;
  onClose: () => void;
}

export function VaultAutocomplete({
  items,
  selectedIndex,
  position,
  onSelect,
  onClose,
}: VaultAutocompleteProps) {
  if (items.length === 0) {
    return (
      <div
        className="fixed z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
        style={{ left: position.x, top: position.y }}
      >
        <div className="px-4 py-3 text-sm text-gray-500">
          No vault items found
        </div>
      </div>
    );
  }

  const getIcon = (type: VaultItem["type"]) => {
    switch (type) {
      case "bio":
        return <User className="h-4 w-4 text-blue-500" />;
      case "folder":
        return <Folder className="h-4 w-4 text-yellow-500" />;
      case "file":
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: VaultItem["type"]) => {
    switch (type) {
      case "bio":
        return "Bio";
      case "folder":
        return "Folder";
      case "file":
        return "File";
    }
  };

  return (
    <>
      {/* Backdrop to close on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-label="Close autocomplete"
      />
      
      {/* Dropdown */}
      <div
        className="fixed z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-xl"
        style={{ left: position.x, top: position.y }}
      >
        <div className="py-2">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            +Vault
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-900"
                    : "hover:bg-gray-50 text-gray-900"
                }`}
                aria-selected={index === selectedIndex}
              >
                <div className="flex-shrink-0">
                  {getIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getTypeLabel(item.type)}
                  </div>
                </div>
                
                {index === selectedIndex && (
                  <div className="text-xs text-blue-600 font-medium">
                    ⏎
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="px-3 py-1.5 mt-1 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <span className="font-medium">↑↓</span> Navigate{" "}
              <span className="font-medium">⏎</span> Select{" "}
              <span className="font-medium">Esc</span> Close
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

