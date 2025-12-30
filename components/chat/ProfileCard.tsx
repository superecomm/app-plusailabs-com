"use client";

import Link from "next/link";
import { MessageSquare, ArrowUpRight } from "lucide-react";

interface ProfileCardProps {
  displayName: string;
  handle: string;
  photoURL?: string;
  bio?: string;
  stats?: {
    conversations?: number;
    posts?: number;
  };
}

export function ProfileCard({ displayName, handle, photoURL, bio, stats }: ProfileCardProps) {
  return (
    <div className="my-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg max-w-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        {/* Photo */}
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-lg font-bold text-gray-600">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {displayName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">@{handle}</p>
        </div>
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
          {bio}
        </p>
      )}

      {/* Stats */}
      {stats && (
        <div className="flex gap-4 mb-3 text-xs">
          {stats.conversations !== undefined && (
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.conversations}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">chats</span>
            </div>
          )}
          {stats.posts !== undefined && (
            <div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.posts}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">posts</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-1.5">
        <Link
          href={`/?invoke=+${handle}`}
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Chat
        </Link>
        <Link
          href={`/messages/new?to=${handle}`}
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Message
        </Link>
        <Link
          href={`/u/${handle}`}
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowUpRight className="w-3 h-3" />
          View
        </Link>
      </div>
    </div>
  );
}

