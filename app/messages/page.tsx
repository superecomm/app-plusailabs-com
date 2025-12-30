"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { ArrowLeft, Search, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import type { MessageThread } from "@/types/messaging";
import { formatDistanceToNow } from "date-fns";
import { DraftsList } from "@/components/messages/DraftsList";

export default function MessagesPage() {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchThreads = async () => {
      try {
        const response = await fetch(`/api/messages/threads?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setThreads(data.threads || []);
        } else {
          // API failed, but don't block UI
          console.error("Failed to fetch threads, showing empty list");
          setThreads([]);
        }
      } catch (error) {
        console.error("Error fetching threads:", error);
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [currentUser]);

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    const otherUserId = thread.participants.find(p => p !== currentUser?.uid);
    const otherUserData = otherUserId ? thread.participantData[otherUserId] : null;
    return (
      otherUserData?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      otherUserData?.handle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <AuthGate>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 p-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold">Messages</h1>
            </div>
            <Link
              href="/messages/new"
              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Drafts Section */}
        <DraftsList />

        {/* Thread List */}
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                {searchQuery ? 'No conversations found' : 'No messages yet'}
              </p>
              <Link
                href="/messages/new"
                className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
              >
                Start a conversation
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredThreads.map((thread) => {
                // Handle self-messaging (Notes to Self)
                const isSelfThread = thread.participants.length === 2 && 
                                    thread.participants[0] === thread.participants[1];
                
                const otherUserId = isSelfThread 
                  ? currentUser?.uid 
                  : thread.participants.find(p => p !== currentUser?.uid);
                
                const otherUser = otherUserId ? thread.participantData[otherUserId] : null;
                const unread = thread.unreadCount?.[currentUser?.uid || ''] || 0;

                return (
                  <Link
                    key={thread.id}
                    href={`/messages/${thread.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {isSelfThread ? (
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-lg">📝</span>
                        </div>
                      ) : otherUser?.photoURL ? (
                        <img
                          src={otherUser.photoURL}
                          alt={otherUser.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-lg font-bold">
                          {otherUser?.displayName?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {isSelfThread ? 'Notes to Self' : otherUser?.displayName}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {thread.lastMessage?.timestamp && formatDistanceToNow(thread.lastMessage.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {isSelfThread ? 'Private notes' : `@${otherUser?.handle}`}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-1">
                          {thread.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {unread > 0 && (
                        <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {unread > 9 ? '9+' : unread}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

