"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusModal } from "@/components/StatusModal";
import { NeuralBox } from "@/components/viim/NeuralBox";
import type { VoiceLockDataset, VoiceLockProfile } from "@/types/voiceLock";
import { Menu, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";

interface ChatInterfaceProps {
  conversationId?: string;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const { currentUser, userSubscription } = useAuth();
  const searchParams = useSearchParams();
  const {
    conversationPreviews,
    loadConversation,
    startNewConversation,
    renameConversation,
    removeConversation,
    currentConversationId,
  } = useChat();
  const router = useRouter();
  
  const [profile, setProfile] = useState<VoiceLockProfile | null>(null);
  const [currentDataset, setCurrentDataset] = useState<VoiceLockDataset | null>(null);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "explore">("chat");
  const [selectedMedia, setSelectedMedia] = useState<{ title: string; author: string; views: string; duration?: string; category?: string } | null>(null);

  const exploreFeed: Array<
    | { kind: "row"; title: string; items: { title: string; author: string; views: string; duration: string }[] }
    | { kind: "card"; title: string; category: string; author: string; views: string; duration?: string }
  > = [
    { kind: "card", title: "AI Safety Briefing: Week in Review", category: "Top News", author: "Newsroom", views: "22.4K views" },
    {
      kind: "row",
      title: "Trending Videos",
      items: [
        { title: "Build a multi-model prompt", author: "Creator Lab", views: "12.4K views", duration: "8:12" },
        { title: "Voice safety deep dive", author: "AI Safety", views: "9.1K views", duration: "6:48" },
        { title: "Gemini vs Claude vs GPT", author: "Model Bench", views: "15.9K views", duration: "10:03" },
        { title: "Protect your likeness", author: "Security Desk", views: "7.3K views", duration: "5:17" },
      ],
    },
    { kind: "card", title: "Lo-fi focus beats generated with Grok", category: "Music", author: "Beat Forge", views: "18.2K views", duration: "3:44" },
    { kind: "card", title: "Family Plan: Kid-safe view mode walkthrough", category: "Lifestyle", author: "Home AI", views: "6.9K views", duration: "4:11" },
    {
      kind: "row",
      title: "Creator Playlists",
      items: [
        { title: "Launch a story with images", author: "Story Studio", views: "4.2K views", duration: "4:55" },
        { title: "Turn notes into scripts", author: "Studio AI", views: "6.7K views", duration: "7:21" },
        { title: "Beat-making with Grok", author: "Beat Forge", views: "5.6K views", duration: "3:44" },
        { title: "Design mood boards", author: "Vision Lab", views: "8.9K views", duration: "6:02" },
      ],
    },
    { kind: "card", title: "Food AI: Generate meal plans with family preferences", category: "Food", author: "Kitchen Lab", views: "5.3K views", duration: "5:09" },
    { kind: "card", title: "Entertainment picks: Summarize trailers & reviews", category: "Entertainment", author: "Reel AI", views: "7.7K views", duration: "6:28" },
    {
      kind: "row",
      title: "Secure AI How-Tos",
      items: [
        { title: "Set up voice lock", author: "Security Desk", views: "3.3K views", duration: "5:01" },
        { title: "Share safely with family", author: "Home AI", views: "2.9K views", duration: "4:36" },
        { title: "Identity-safe prompts", author: "Trust Team", views: "4.8K views", duration: "5:58" },
        { title: "Model safety controls", author: "Ops Lab", views: "3.7K views", duration: "4:12" },
      ],
    },
    { kind: "card", title: "Tech: Switch models mid-chat without losing context", category: "Tech", author: "Model Bench", views: "9.8K views", duration: "4:42" },
    { kind: "card", title: "Gaming: NPC dialog powered by multi-model prompts", category: "Gaming", author: "PlayGrid", views: "8.1K views", duration: "5:55" },
    { kind: "card", title: "Learning: Study smarter with spaced repetition via AI", category: "Learning", author: "Study Lab", views: "12.0K views", duration: "6:18" },
  ];

  const statusMessages = ["Uploading sample…", "Processing…", "Updating dataset…"];

  // Load conversation from URL param
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, currentConversationId, loadConversation]);

  // Sync URL when conversation ID changes (e.g. new chat created)
  useEffect(() => {
    if (currentConversationId && currentConversationId !== conversationId) {
      // Use shallow routing to update URL without full reload
      window.history.pushState(null, "", `/c/${currentConversationId}`);
    }
  }, [currentConversationId, conversationId]);

  useEffect(() => {
    if (!currentUser) return;
    fetchProfile();
    fetchCurrentDataset();
  }, [currentUser]);

  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/voice-lock/profile?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchCurrentDataset = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/voice-lock/datasets/active?userId=${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentDataset(data);
      } else if (response.status === 404) {
        setCurrentDataset(null);
      }
    } catch (error) {
      console.error("Error fetching dataset:", error);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setShowStatusModal(true);
    await saveSession(audioBlob);
  };

  const saveSession = async (audioBlob: Blob) => {
    if (!currentUser) return;
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("userId", currentUser.uid);
      formData.append("source", "mobile");
      formData.append("vocalType", "speech");

      const response = await fetch("/api/voice-lock/session", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        if (data.dataset) {
          setCurrentDataset(data.dataset);
        }
      }
    } catch (error) {
      console.error("Error saving session:", error);
    } finally {
      setShowStatusModal(false);
    }
  };

  const handleStatusComplete = () => {
    setShowStatusModal(false);
  };

  const handleNewChat = () => {
    startNewConversation();
    setIsHistoryOpen(false);
    router.push("/c/");
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
    setIsHistoryOpen(false);
    router.push(`/c/${id}`);
  };

  const subscriptionStatus = userSubscription?.status;
  const hasActiveSubscription =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";
  // No pre-wall overlay; gating is handled on the subscribe flow
  const needsSubscription = false;
  const autoAuth = searchParams.get("auth") === "1";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-transparent text-gray-900 relative">
        {/* Glassmorphism overlay for unauthenticated users (blocks clicks, blurs background) */}
        {!currentUser && (
          <div className="fixed inset-0 z-20 bg-white/50 backdrop-blur-md pointer-events-auto" />
        )}

        <header
          className={`fixed top-0 left-0 right-0 z-30 border-b border-transparent bg-white/95 backdrop-blur-sm ${
            !currentUser ? "pointer-events-none select-none opacity-50" : ""
          }`}
        >
          <div style={{ paddingTop: 'env(safe-area-inset-top)' }} className="w-full">
            <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-3">
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full p-2 text-gray-900 transition hover:bg-gray-100"
                  aria-label="Open conversation history"
                  onClick={() => setIsHistoryOpen(true)}
                  disabled={!currentUser}
                >
                  <Menu className="h-4 w-4" />
                </button>
                <Image
                  src={plusAi}
                  alt="+AI"
                  className="h-4 w-auto object-contain"
                  priority
                />
              </div>

              <div className="flex-1 flex justify-center">
                <div className="inline-flex items-center gap-3 text-sm font-semibold text-gray-900">
                  <button
                    type="button"
                    aria-pressed={viewMode === "chat"}
                    onClick={() => setViewMode("chat")}
                    className={`pb-1 transition ${
                      viewMode === "chat"
                        ? "text-gray-900 border-b-2 border-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === "explore"}
                    onClick={() => setViewMode("explore")}
                    className={`pb-1 transition ${
                      viewMode === "explore"
                        ? "text-gray-900 border-b-2 border-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    Explore
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3" />
            </div>
          </div>
        </header>

        <main className="relative z-20 flex-1 min-h-0 overflow-hidden px-4 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden">
            {viewMode === "chat" ? (
              <NeuralBox
                variant="assistant"
                audioDeviceId={selectedAudioDevice}
                className="flex-1 min-h-0"
                onAudioCapture={handleRecordingComplete}
                showInputPanel
                forcePromptVisible
                blurInput={!currentUser || needsSubscription}
                openAuthOnMount={!currentUser && autoAuth}
              />
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-2 pt-0">
                {exploreFeed.map((block, idx) =>
                  block.kind === "row" ? (
                    <div key={`${block.title}-${idx}`} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                            Explore
                          </p>
                          <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <div className="flex gap-4 pb-2">
                          {block.items.map((item) => (
                            <div
                              key={item.title}
                              className="w-56 min-w-[14rem] bg-white cursor-pointer transition hover:opacity-90"
                              onClick={() => setSelectedMedia(item)}
                            >
                            <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
                                  {item.duration}
                                </div>
                              </div>
                              <div className="space-y-2 p-3">
                                <div className="flex items-start gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gray-300 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                                    <p className="text-xs text-gray-500">{item.author}</p>
                                    <p className="text-xs text-gray-500">{item.views}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-base">+</span>
                                    <span>124</span>
                                  </button>
                                  <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-base">−</span>
                                    <span>8</span>
                                  </button>
                                  <button className="text-gray-600 hover:text-gray-900" onClick={(e) => e.stopPropagation()}>
                                    💬 23
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={`${block.title}-${idx}`}
                      className="mx-auto w-full max-w-4xl bg-white cursor-pointer transition hover:opacity-90"
                      onClick={() => setSelectedMedia(block)}
                    >
                      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                        {block.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">
                            {block.duration}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-3">
                        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          <span>{block.category}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 line-clamp-2">{block.title}</p>
                            <p className="text-[11px] text-gray-500">
                              {block.author} • {block.views}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900" onClick={(e) => e.stopPropagation()}>
                            <span className="text-base">+</span>
                            <span>324</span>
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900" onClick={(e) => e.stopPropagation()}>
                            <span className="text-base">−</span>
                            <span>12</span>
                          </button>
                          <button className="text-gray-600 hover:text-gray-900" onClick={(e) => e.stopPropagation()}>
                            💬 45
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </main>

        <StatusModal isVisible={showStatusModal} messages={statusMessages} onComplete={handleStatusComplete} />

        {isHistoryOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-[90%] max-w-sm flex-col bg-white/95 shadow-2xl ring-1 ring-black/5">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">History</p>
                  <p className="text-base font-semibold text-gray-900">Conversation log</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs font-semibold text-gray-600 transition hover:text-gray-900"
                    onClick={handleNewChat}
                  >
                    + New Chat
                  </button>
                  <button
                    className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100"
                    aria-label="Close history"
                    onClick={() => setIsHistoryOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="border-b border-gray-100 px-5 py-3">
                <input
                  type="text"
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 px-5 py-4">
                {conversationPreviews.length === 0 ? (
                  <p className="text-sm text-gray-500">No conversations yet. Start a prompt to begin.</p>
                ) : (
                  conversationPreviews
                    .filter((preview) => preview.title.toLowerCase().includes(historyQuery.toLowerCase()))
                    .map((preview) => (
                      <div
                        key={preview.id}
                        className="rounded-2xl border border-gray-100 bg-white/90 px-4 py-3 shadow-sm transition hover:border-gray-200"
                      >
                        <button
                          onClick={() => handleSelectConversation(preview.id)}
                          className="w-full text-left"
                        >
                          <p className="font-semibold text-gray-900">{preview.title || "Untitled"}</p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(preview.updatedAt), { addSuffix: true })}
                          </p>
                        </button>
                        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-gray-500">
                          <button
                            onClick={() => {
                              const nextTitle = prompt("Rename conversation", preview.title);
                              if (nextTitle?.trim()) {
                                renameConversation(preview.id, nextTitle.trim());
                              }
                            }}
                            className="rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => removeConversation(preview.id)}
                            className="rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="flex w-full items-center gap-3 px-1 py-2 text-left text-gray-700">
                  <UserAvatar onDeviceChange={(deviceId) => setSelectedAudioDevice(deviceId)} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{currentUser?.displayName || "Account"}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email || "Signed in"}</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {selectedMedia && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            onClick={() => setSelectedMedia(null)}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-3 text-white transition hover:bg-black/70"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <div 
              className="flex h-full w-full flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="mb-4 text-6xl">▶</div>
                    <p className="text-sm opacity-70">Media Player Placeholder</p>
                  </div>
                </div>
                {selectedMedia.duration && (
                  <div className="absolute bottom-4 right-4 rounded-md bg-black/70 px-3 py-1.5 text-sm font-semibold text-white">
                    {selectedMedia.duration}
                  </div>
                )}
              </div>
              <div className="mt-6 w-full max-w-6xl text-white">
                <h2 className="text-2xl font-bold">{selectedMedia.title}</h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-300">
                  <span>{selectedMedia.author}</span>
                  <span>•</span>
                  <span>{selectedMedia.views}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
