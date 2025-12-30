"use client";

import { User } from "lucide-react";
import type { UserProfile } from "@/hooks/useAtMentionAutocomplete";
import Image from "next/image";

/**
 * At mention (@) Autocomplete UI
 * 
 * Dropdown component for at mention (@) social mention system.
 * Displays matching user profiles when @ is typed.
 */

interface AtMentionAutocompleteProps {
  users: UserProfile[];
  selectedIndex: number;
  position: { x: number; y: number };
  onSelect: (user: UserProfile) => void;
  onClose: () => void;
}

export function AtMentionAutocomplete({
  users,
  selectedIndex,
  position,
  onSelect,
  onClose,
}: AtMentionAutocompleteProps) {
  if (users.length === 0) {
    return (
      <div
        className="fixed z-50 w-72 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
        style={{ left: position.x, top: position.y }}
      >
        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          No users found
        </div>
      </div>
    );
  }

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
        className="fixed z-50 w-80 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
        style={{ left: position.x, top: position.y }}
      >
        <div className="py-2">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            At mention (@)
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {users.map((user, index) => (
              <button
                key={user.userId}
                onClick={() => onSelect(user)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                }`}
                aria-selected={index === selectedIndex}
              >
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user.displayName}
                    {user.isYou && (
                      <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">(You)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    @{user.handle}
                  </div>
                </div>
                
                {index === selectedIndex && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    ⏎
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="px-3 py-1.5 mt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">
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

