"use client";

import { formatDistanceToNow } from "date-fns";
import type { DirectMessage } from "@/types/messaging";

interface MessageBubbleProps {
  message: DirectMessage;
  isOwn: boolean;
  isRead?: boolean;
}

export function MessageBubble({ message, isOwn, isRead }: MessageBubbleProps) {
  if (message.deleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} my-2`}>
        <div className="max-w-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 italic text-sm">
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={`max-w-xs px-3 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatDistanceToNow(message.createdAt, { addSuffix: true })}
          </span>
          {isOwn && isRead && (
            <span className="text-xs text-blue-100">Read</span>
          )}
        </div>
      </div>
    </div>
  );
}

