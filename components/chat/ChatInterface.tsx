"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusModal } from "@/components/StatusModal";
import { NeuralBox } from "@/components/viim/NeuralBox";
import type { VoiceLockDataset, VoiceLockProfile } from "@/types/voiceLock";
import {
  Menu,
  X,
  Edit2,
  Trash2,
  MessageSquare,
  Cloud,
  FolderPlus,
  UploadCloud,
  Sun,
  Moon,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import plusAiBlack from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";
import plusAiWhite from "@/assets/plusailabs brand assets/plusai-full-logo-white.png";
import { storage } from "@/lib/firebase/client";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { IOSInstallHelper } from "@/components/pwa/iOSInstallHelper";
import { NetworkBanner } from "@/components/pwa/NetworkBanner";
import { initInstallPrompt } from "@/lib/pwa/installPrompt";
import { MessagesIcon } from "@/components/layout/MessagesIcon";
import { MapView } from "@/components/map/MapView";

interface ChatInterfaceProps {
  conversationId?: string;
}

const STATUS_MESSAGES = ["Uploading sample…", "Processing…", "Updating dataset…"];

export const ChatInterface = memo(function ChatInterface({
  conversationId,
}: ChatInterfaceProps) {
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "explore" | "cloud" | "map">("chat");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeSlider, setThemeSlider] = useState(0); // 0 = light, 1 = dark
  const [textSizeSlider, setTextSizeSlider] = useState(0); // 0..1 scale (default smallest)
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultBio, setVaultBio] = useState(
    "Add your bio, preferences, and key context here for +Agent to use.",
  );
  const [vaultSaving, setVaultSaving] = useState(false);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [vaultFolders, setVaultFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [vaultFiles, setVaultFiles] = useState<
    Array<{
      id: string;
      name: string;
      size: number;
      folderId: string | null;
      downloadUrl: string;
      contentType: string;
    }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const [driveFolders, setDriveFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [driveFilesAll, setDriveFilesAll] = useState<
    Array<{
      id: string;
      name: string;
      size: number;
      folderId: string | null;
      downloadUrl: string;
      contentType: string;
    }>
  >([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveSearch, setDriveSearch] = useState("");
  const [driveUsageBytes, setDriveUsageBytes] = useState(0);

  // explore overlay + media
  const [showExploreOverlay, setShowExploreOverlay] = useState(false);
  const [exploreStep, setExploreStep] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const seen = window.sessionStorage.getItem("exploreSeen");
      return seen ? 3 : 1;
    }
    return 1;
  });
  const [selectedMedia, setSelectedMedia] = useState<{
    title: string;
    author: string;
    views: string;
    duration?: string;
    category?: string;
  } | null>(null);

  // chat scroll container – keeps repaint local to chat area
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(val >= 10 ? 0 : 1)} ${sizes[i]}`;
  };

  // Initialize PWA install prompt on mount
  useEffect(() => {
    initInstallPrompt();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("chat-theme");
    if (saved === "dark" || saved === "light") {
      setTheme(saved);
      setThemeSlider(saved === "dark" ? 1 : 0);
    }
    const savedText = window.localStorage.getItem("chat-text-scale");
    if (savedText) {
      const parsed = Number(savedText);
      if (!Number.isNaN(parsed)) {
        setTextSizeSlider(Math.min(1, Math.max(0, parsed)));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("chat-theme", theme);
    setThemeSlider(theme === "dark" ? 1 : 0);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("chat-text-scale", String(textSizeSlider));
  }, [textSizeSlider]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const doc = document.documentElement;
    const original = doc.style.fontSize;
    const scaledPx = 16 * (0.9 + textSizeSlider * 0.4);
    doc.style.fontSize = `${scaledPx}px`;
    return () => {
      doc.style.fontSize = original;
    };
  }, [textSizeSlider]);

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

  useEffect(() => {
    const loadVault = async () => {
      if (!currentUser) return;
      try {
        const res = await fetch(`/api/vault/bio?userId=${currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.content === "string") {
            setVaultBio(data.content || "");
          }
          setVaultLoaded(true);
        }
      } catch (error) {
        console.error("Error loading vault bio:", error);
      }
    };
    loadVault();
  }, [currentUser]);

  const loadFolders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/vault/folders?userId=${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setVaultFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const loadFiles = async (folderId: string | null) => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams({ userId: currentUser.uid });
      if (folderId) params.set("folderId", folderId);
      const res = await fetch(`/api/vault/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVaultFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  useEffect(() => {
    if (!currentUser || !isVaultOpen) return;
    loadFolders();
    loadFiles(selectedFolderId);
  }, [currentUser, isVaultOpen, selectedFolderId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [openMenuId]);

  const loadDriveFolders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/drive/folders?userId=${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setDriveFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Error loading drive folders:", error);
    }
  };

  const loadDriveFiles = async () => {
    if (!currentUser) return;
    try {
      const params = new URLSearchParams({ userId: currentUser.uid });
      const res = await fetch(`/api/drive/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const files = data.files || [];
        setDriveFilesAll(files);
        const totalBytes = files.reduce(
          (acc: number, f: any) => acc + (f.size || 0),
          0,
        );
        setDriveUsageBytes(totalBytes);
      }
    } catch (error) {
      console.error("Error loading drive files:", error);
    }
  };

  useEffect(() => {
    if (!currentUser || viewMode !== "cloud") return;
    loadDriveFolders();
    loadDriveFiles();
  }, [currentUser, viewMode]);

  const fetchProfile = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `/api/voice-lock/profile?userId=${currentUser.uid}`,
      );
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
      const response = await fetch(
        `/api/voice-lock/datasets/active?userId=${currentUser.uid}`,
      );
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

  const handleNewChat = async () => {
    const newId = await startNewConversation();
    setIsHistoryOpen(false);

    if (newId) {
      router.push(`/c/${newId}`);
    } else {
      router.push("/c");
    }
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
    <>
      {/* PWA Modals (render outside main container) */}
      <IOSInstallHelper />

        <div
          className={`flex min-h-screen flex-col overflow-hidden ${
            theme === "dark" ? "bg-black text-white" : "bg-transparent text-gray-900"
          }`}
          style={{
            fontSize: `${0.85 + textSizeSlider * 0.45}rem`,
          }}
        >

        {/* PWA Banners - at top of main container */}
        <InstallBanner />
        <NetworkBanner />

        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            backgroundColor: "#000",
            opacity: Math.max(0, Math.min(1, themeSlider)) * 0.6,
          }}
        />
        <div className="relative z-10 flex h-full flex-col">
          {/* Glassmorphism overlay for unauthenticated users (blocks clicks, blurs background) */}
          {!currentUser && (
            <div className="fixed inset-0 z-20 bg-white/50 backdrop-blur-md pointer-events-auto" />
          )}

          <header
            className={`fixed top-0 left-0 right-0 z-30 border-b backdrop-blur-sm ${
              theme === "dark"
                ? "bg-black/90 border-gray-800"
                : "bg-white/95 border-transparent"
            } ${
              !currentUser ? "pointer-events-none select-none opacity-50" : ""
            }`}
          >
            <div
              style={{ paddingTop: "env(safe-area-inset-top)" }}
              className="w-full"
            >
              <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 px-3">
                <div className="flex items-center gap-2">
                  <button
                    className={`rounded-full p-2 transition ${
                      theme === "dark"
                        ? "text-white hover:bg-gray-800"
                        : "text-gray-900 hover:bg-gray-100"
                    }`}
                    aria-label="Open conversation history"
                    onClick={() => setIsHistoryOpen(true)}
                    disabled={!currentUser}
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <Image
                    src={theme === "dark" ? plusAiWhite : plusAiBlack}
                    alt="+AI"
                    className="h-4 w-auto object-contain"
                    priority
                  />
                </div>

                <div className="flex-1 flex justify-center">
                  <div
                    className={`inline-flex items-center gap-3 text-sm font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <button
                      type="button"
                      aria-pressed={viewMode === "chat"}
                      onClick={() => setViewMode("chat")}
                      className={`pb-1 transition ${
                        viewMode === "chat"
                          ? theme === "dark"
                            ? "text-white border-b-2 border-white"
                            : "text-gray-900 border-b-2 border-gray-900"
                          : theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      type="button"
                      aria-pressed={viewMode === "explore"}
                      onClick={() => {
                        setViewMode("explore");
                      }}
                      className={`pb-1 transition ${
                        viewMode === "explore"
                          ? theme === "dark"
                            ? "text-white border-b-2 border-white"
                            : "text-gray-900 border-b-2 border-gray-900"
                          : theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Explore
                    </button>
                    <button
                      type="button"
                      aria-pressed={viewMode === "map"}
                      onClick={() => setViewMode("map")}
                      className={`pb-1 transition ${
                        viewMode === "map"
                          ? theme === "dark"
                            ? "text-white border-b-2 border-white"
                            : "text-gray-900 border-b-2 border-gray-900"
                          : theme === "dark"
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      Map
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MessagesIcon />
                  <UserAvatar
                    onDeviceChange={(deviceId) =>
                      setSelectedAudioDevice(deviceId)
                    }
                  />
                </div>
              </div>
            </div>
          </header>

          <main
            className="relative z-20 flex-1 min-h-0 overflow-hidden"
            style={{
              paddingTop: viewMode === "map" ? "0" : "1rem",
              paddingBottom:
                viewMode === "map"
                  ? "0"
                  : "max(1rem, env(safe-area-inset-bottom))",
              paddingLeft: viewMode === "map" ? "0" : "1rem",
              paddingRight: viewMode === "map" ? "0" : "1rem",
            }}
          >
            <div
              ref={chatScrollRef}
              className={`mx-auto flex h-full w-full flex-col overflow-hidden ${
                viewMode === "map" ? "" : "max-w-5xl"
              }`}
            >
              {viewMode === "chat" && (
                <NeuralBox
                  variant="assistant"
                  audioDeviceId={selectedAudioDevice}
                  className="flex-1 min-h-0"
                  onAudioCapture={handleRecordingComplete}
                  showInputPanel
                  forcePromptVisible
                  blurInput={!currentUser || needsSubscription}
                  openAuthOnMount={!currentUser && autoAuth}
                  theme={theme}
                />
              )}

              {viewMode === "explore" && (
                <div className="flex-1 overflow-y-auto">
                  <iframe
                    src="/explore"
                    className="w-full h-full border-0"
                    title="Explore Feed"
                  />
                </div>
              )}

              {viewMode === "map" && <MapView theme={theme} />}

              {/* Cloud view - accessible from sidebar only */}
              {viewMode === "cloud" && (
                <div
                  className={`flex-1 min-h-0 flex flex-col gap-3 p-3 sm:p-4 ${
                    theme === "dark"
                      ? "bg-gray-900 text-gray-50"
                      : "bg-gray-50 text-gray-900"
                  }`}
                >
                  {/* ... cloud view content unchanged ... */}
                </div>
              )}

              {viewMode === "explore" && (
                <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500">
                  {/* Explore feed disabled until launch */}
                </div>
              )}
            </div>
          </main>

          <StatusModal
            isVisible={showStatusModal}
            messages={STATUS_MESSAGES}
            onComplete={handleStatusComplete}
          />

          {/* History Sidebar */}
          {isHistoryOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsHistoryOpen(false)}
                aria-hidden="true"
              />
              <div className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[90vw] shadow-2xl ring-1 ring-black/10 transition ${
                theme === "dark" 
                  ? "bg-black border-r border-gray-800" 
                  : "bg-white"
              }`}>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className={`flex items-center justify-between p-4 border-b ${
                    theme === "dark" ? "border-gray-800" : "border-gray-200"
                  }`}>
                    <h2 className={`text-lg font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}>
                      Conversations
                    </h2>
                    <button
                      onClick={() => setIsHistoryOpen(false)}
                      className={`rounded-full p-1.5 transition ${
                        theme === "dark"
                          ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* New Chat Button */}
                  <div className={`p-4 border-b ${
                    theme === "dark" ? "border-gray-800" : "border-gray-200"
                  }`}>
                    <button
                      onClick={handleNewChat}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                        theme === "dark"
                          ? "bg-gray-800 text-white hover:bg-gray-700"
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      New Chat
                    </button>
                  </div>

                  {/* Search */}
                  <div className={`p-4 border-b ${
                    theme === "dark" ? "border-gray-800" : "border-gray-200"
                  }`}>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={historyQuery}
                      onChange={(e) => setHistoryQuery(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${
                        theme === "dark"
                          ? "bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-gray-600"
                          : "bg-gray-50 text-gray-900 placeholder-gray-500 border border-gray-200 focus:border-gray-300"
                      } focus:outline-none`}
                    />
                  </div>

                  {/* Conversation List */}
                  <div className="flex-1 overflow-y-auto">
                    {conversationPreviews.length === 0 ? (
                      <div className={`p-4 text-center text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>
                        No conversations yet
                      </div>
                    ) : (
                      <div className="p-2">
                        {conversationPreviews
                          .filter((conv) =>
                            historyQuery
                              ? conv.title.toLowerCase().includes(historyQuery.toLowerCase())
                              : true
                          )
                          .map((conv) => (
                            <div
                              key={conv.id}
                              className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition mb-1 ${
                                conv.id === currentConversationId
                                  ? theme === "dark"
                                    ? "bg-gray-800"
                                    : "bg-gray-100"
                                  : theme === "dark"
                                  ? "hover:bg-gray-800/50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div 
                                className="flex-1 min-w-0"
                                onClick={() => handleSelectConversation(conv.id)}
                              >
                                {renamingId === conv.id ? (
                                  <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        if (renameValue.trim()) {
                                          renameConversation(conv.id, renameValue.trim());
                                        }
                                        setRenamingId(null);
                                        setRenameValue("");
                                      } else if (e.key === "Escape") {
                                        setRenamingId(null);
                                        setRenameValue("");
                                      }
                                    }}
                                    onBlur={() => {
                                      if (renameValue.trim()) {
                                        renameConversation(conv.id, renameValue.trim());
                                      }
                                      setRenamingId(null);
                                      setRenameValue("");
                                    }}
                                    autoFocus
                                    className={`w-full text-sm font-medium px-2 py-1 rounded border ${
                                      theme === "dark"
                                        ? "bg-gray-900 border-gray-700 text-white"
                                        : "bg-white border-gray-300 text-gray-900"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <>
                                    <div className={`text-sm font-medium truncate ${
                                      theme === "dark" ? "text-white" : "text-gray-900"
                                    }`}>
                                      {conv.title || "Untitled"}
                                    </div>
                                    <div className={`text-xs mt-0.5 ${
                                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                                    }`}>
                                      {formatDistanceToNow(new Date(conv.updatedAt), {
                                        addSuffix: true,
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === conv.id ? null : conv.id);
                                  }}
                                  className={`p-1.5 rounded transition opacity-0 group-hover:opacity-100 ${
                                    openMenuId === conv.id ? "opacity-100" : ""
                                  } ${
                                    theme === "dark"
                                      ? "hover:bg-gray-700 text-gray-400"
                                      : "hover:bg-gray-200 text-gray-500"
                                  }`}
                                  aria-label="More options"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                {openMenuId === conv.id && (
                                  <div
                                    ref={menuRef}
                                    className={`absolute right-2 top-12 z-50 w-48 rounded-lg shadow-lg border ${
                                      theme === "dark"
                                        ? "bg-gray-800 border-gray-700"
                                        : "bg-white border-gray-200"
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRenameValue(conv.title || "");
                                        setRenamingId(conv.id);
                                        setOpenMenuId(null);
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                                        theme === "dark"
                                          ? "text-gray-200 hover:bg-gray-700"
                                          : "text-gray-700 hover:bg-gray-50"
                                      } rounded-t-lg`}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      <span>Rename</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          confirm(
                                            "Are you sure you want to delete this conversation?"
                                          )
                                        ) {
                                          removeConversation(conv.id);
                                          setOpenMenuId(null);
                                        }
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                                        theme === "dark"
                                          ? "text-red-400 hover:bg-gray-700"
                                          : "text-red-600 hover:bg-gray-50"
                                      } rounded-b-lg`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
});
