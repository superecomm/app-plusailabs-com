"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMessageThread } from "@/hooks/useMessageThread";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { MessageComposer } from "@/components/messages/MessageComposer";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { updateLastReadAt } from "@/lib/messaging/threadService";
import type { MessageThread } from "@/types/messaging";

export default function MessageThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const threadId = params.threadId as string;
  
  const { messages, loading } = useMessageThread(threadId);
  const { typingUsers, setTyping } = useTypingIndicator(threadId, currentUser?.uid || null);
  
  const [thread, setThread] = useState<MessageThread | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch thread metadata
  useEffect(() => {
    if (!threadId || !currentUser) return;

    const fetchThread = async () => {
      try {
        const response = await fetch(`/api/messages/threads?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          const foundThread = data.threads.find((t: MessageThread) => t.id === threadId);
          setThread(foundThread || null);
        }
      } catch (error) {
        console.error("Error fetching thread:", error);
      }
    };

    fetchThread();
  }, [threadId, currentUser]);

  // Mark as read when viewing
  useEffect(() => {
    if (!threadId || !currentUser) return;

    updateLastReadAt(threadId, currentUser.uid);
  }, [threadId, currentUser, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!currentUser || !thread) return;

    setSending(true);
    try {
      const recipientId = thread.participants.find(p => p !== currentUser.uid);
      
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          senderId: currentUser.uid,
          text,
          recipientId,
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!thread && !loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Conversation not found</p>
          <Link href="/messages" className="text-blue-600 text-sm">
            ← Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  // Handle self-messaging (Notes to Self)
  const isSelfThread = thread?.participants.length === 2 && 
                       thread.participants[0] === thread.participants[1];
  
  const otherUserId = isSelfThread 
    ? currentUser?.uid 
    : thread?.participants.find(p => p !== currentUser?.uid);
  
  const otherUser = otherUserId && thread ? thread.participantData[otherUserId] : null;
  
  // Check if message is read (other user's lastReadAt > message createdAt)
  const isMessageRead = (messageCreatedAt: Date) => {
    if (!thread || !otherUserId || isSelfThread) return false;
    const lastRead = thread.lastReadAt?.[otherUserId];
    return lastRead && messageCreatedAt <= lastRead;
  };

  return (
    <AuthGate>
      <div className="flex flex-col h-screen bg-white dark:bg-black">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 p-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Link
              href="/messages"
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {isSelfThread ? 'Notes to Self' : (otherUser?.displayName || 'Loading...')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isSelfThread ? 'Private notes and reminders' : `@${otherUser?.handle}`}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUser?.uid}
                    isRead={message.senderId === currentUser?.uid && isMessageRead(message.createdAt)}
                  />
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && otherUser && (
                  <TypingIndicator displayName={otherUser.displayName} />
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <MessageComposer
              onSend={handleSend}
              onTyping={setTyping}
              disabled={sending}
            />
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

