"use client";

import { useState, useEffect } from "react";
import { FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { getAllDrafts, deleteDraft } from "@/lib/messaging/drafts";
import { formatDistanceToNow } from "date-fns";
import type { MessageDraft } from "@/lib/messaging/drafts";

export function DraftsList() {
  const [drafts, setDrafts] = useState<Array<{ key: string; draft: MessageDraft }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const allDrafts = await getAllDrafts();
      const draftsArray = Array.from(allDrafts.entries()).map(([key, draft]) => ({
        key,
        draft,
      }));
      setDrafts(draftsArray);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    await deleteDraft(key);
    loadDrafts();
  };

  if (loading || drafts.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Drafts ({drafts.length})
      </h3>
      <div className="space-y-2">
        {drafts.map(({ key, draft }) => (
          <div
            key={key}
            className="flex items-start gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              {draft.recipientHandle && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  To: @{draft.recipientHandle}
                </p>
              )}
              <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                {draft.text}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(draft.timestamp, { addSuffix: true })}
              </p>
            </div>
            <button
              onClick={() => handleDelete(key)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

