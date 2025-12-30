"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { saveDraft, getDraft, deleteDraft, getNewMessageDraftKey } from "@/lib/messaging/drafts";

function NewMessageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const prefilledHandle = searchParams.get('to');

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const draft = await getDraft(getNewMessageDraftKey());
      if (draft) {
        setMessageText(draft.text);
        if (draft.recipientHandle) {
          setSearchQuery(draft.recipientHandle);
          handleSearch(draft.recipientHandle);
        }
      }
    };
    loadDraft();
  }, []);

  // Auto-prefill recipient if provided
  useEffect(() => {
    if (prefilledHandle) {
      setSearchQuery(prefilledHandle);
      handleSearch(prefilledHandle);
    }
  }, [prefilledHandle]);

  // Auto-save draft as user types
  useEffect(() => {
    if (!messageText && !searchQuery) return;

    const saveDraftAsync = async () => {
      await saveDraft(getNewMessageDraftKey(), {
        text: messageText,
        recipientHandle: selectedUser?.handle || searchQuery,
        timestamp: Date.now(),
      });
      
      // Show "Draft saved" notification briefly
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    };

    const timeout = setTimeout(saveDraftAsync, 1000);
    return () => clearTimeout(timeout);
  }, [messageText, searchQuery, selectedUser]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Remove @ if user typed it
      const cleanQuery = query.replace(/^@/, '');
      
      const response = await fetch(`/api/profile/search?q=${encodeURIComponent(cleanQuery)}`);
      if (response.ok) {
        const data = await response.json();
        // Include current user for "Notes to Self"
        const results = data.profiles || [];
        if (currentUser && !results.find((r: any) => r.userId === currentUser.uid)) {
          results.unshift({
            userId: currentUser.uid,
            displayName: currentUser.displayName || 'You',
            handle: currentUser.email?.split('@')[0],
            photoURL: currentUser.photoURL,
            isYou: true,
          });
        }
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !messageText.trim() || !selectedUser) return;

    setSending(true);
    
    try {
      console.log('[Messages] Starting send process...');
      
      // Handle self-messaging (Notes to Self)
      const recipientUserId = selectedUser.isYou ? currentUser.uid : selectedUser.userId;
      
      // Get recipient profile data (skip API call if it's you)
      let profileData;
      if (selectedUser.isYou) {
        profileData = {
          userId: currentUser.uid,
          handle: currentUser.email?.split('@')[0],
          displayName: currentUser.displayName || 'You',
          photoURL: currentUser.photoURL,
        };
      } else {
        const response = await fetch(`/api/profile/public/${selectedUser.handle}`);
        if (!response.ok) {
          console.error('[Messages] Failed to fetch recipient profile');
          setSending(false);
          alert('Could not find recipient. Please try again.');
          return;
        }
        const { profile } = await response.json();
        profileData = profile;
      }
      
      console.log('[Messages] Creating thread...');
      
      // Create or find thread
      const threadResponse = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1: currentUser.uid,
          userId2: recipientUserId,
          user1Data: {
            handle: currentUser.email?.split('@')[0],
            displayName: currentUser.displayName || 'You',
            photoURL: currentUser.photoURL,
          },
          user2Data: {
            handle: profileData.handle,
            displayName: profileData.displayName,
            photoURL: profileData.photoURL,
          },
        }),
      });

      if (!threadResponse.ok) {
        console.error('[Messages] Failed to create thread');
        setSending(false);
        alert('Failed to create conversation. Please try again.');
        return;
      }

      const { threadId } = await threadResponse.json();
      console.log('[Messages] Thread created:', threadId);
      
      // Send the message
      console.log('[Messages] Sending message...');
      const sendResponse = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId,
          senderId: currentUser.uid,
          text: messageText,
          recipientId: recipientUserId,
        }),
      });

      if (!sendResponse.ok) {
        console.error('[Messages] Failed to send message');
        setSending(false);
        alert('Failed to send message. Please try again.');
        return;
      }

      console.log('[Messages] Message sent successfully');
      
      // Delete draft
      await deleteDraft(getNewMessageDraftKey());
      
      // Navigate to inbox
      console.log('[Messages] Navigating to inbox...');
      router.push('/messages');
    } catch (error) {
      console.error('[Messages] Error sending message:', error);
      setSending(false);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSaveDraft = async () => {
    await saveDraft(getNewMessageDraftKey(), {
      text: messageText,
      recipientHandle: selectedUser?.handle || searchQuery,
      timestamp: Date.now(),
    });
    
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSearchQuery(`@${user.handle}`);
    setSearchResults([]);
    // Focus on message textarea
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-white dark:bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 p-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <Link
              href="/messages"
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">New Message</h1>
          </div>
        </div>

        {/* Recipient Selection */}
        <div className="p-4 max-w-2xl mx-auto border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">To:</span>
            {selectedUser ? (
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 dark:bg-blue-950 rounded">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  {selectedUser.displayName}
                </span>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="@handle or name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }
                    
                    searchTimeoutRef.current = setTimeout(() => {
                      handleSearch(e.target.value);
                    }, 300);
                  }}
                  className="w-full px-2 py-1 text-sm bg-transparent border-b border-gray-300 dark:border-gray-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && !selectedUser && (
            <div className="mt-2 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
              {searchResults.map((user) => (
                <button
                  key={user.userId}
                  onClick={() => handleSelectUser(user)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center font-bold">
                      {user.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {user.displayName}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      @{user.handle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Draft Area */}
        <div className="flex-1 p-4 max-w-2xl mx-auto">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={selectedUser ? `Message ${selectedUser.displayName}...` : "Type your message first, then select recipient"}
            className="w-full h-64 resize-none bg-transparent text-sm focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
            autoFocus
          />
        </div>

        {/* Actions (Fixed at bottom) */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 max-w-2xl mx-auto">
          {/* Status notifications */}
          <div className="flex items-center justify-between mb-3 min-h-[20px]">
            {sending && (
              <span className="text-xs text-blue-600 dark:text-blue-400">Sending...</span>
            )}
            {draftSaved && !sending && (
              <span className="text-xs text-green-600 dark:text-green-400">Draft saved ✓</span>
            )}
            {!sending && !draftSaved && messageText.trim() && (
              <button
                onClick={handleSaveDraft}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Save draft
              </button>
            )}
            <div className="flex-1" />
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || !selectedUser || sending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : selectedUser ? `Send to ${selectedUser.displayName}` : 'Select recipient to send'}
          </button>
        </div>
      </div>
    </AuthGate>
  );
}

export default function NewMessagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <NewMessageContent />
    </Suspense>
  );
}

