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
import { Menu, X, Edit2, Trash2, MessageSquare, Cloud, FolderPlus, UploadCloud, Sun, Moon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";
import { storage } from "@/lib/firebase/client";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

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
  const [viewMode, setViewMode] = useState<"chat" | "explore" | "cloud">("chat");
  const [showCloud, setShowCloud] = useState(false);
  const [cloudUsagePct] = useState(24); // placeholder usage %
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [themeSlider, setThemeSlider] = useState(0); // 0 = light, 1 = dark
  const [textSizeSlider, setTextSizeSlider] = useState(0); // 0..1 scale (default smallest)
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultBio, setVaultBio] = useState(
    "Add your bio, preferences, and key context here for +Agent to use."
  );
  const [vaultSaving, setVaultSaving] = useState(false);
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [vaultFolders, setVaultFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [vaultFiles, setVaultFiles] = useState<Array<{ id: string; name: string; size: number; folderId: string | null; downloadUrl: string; contentType: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [driveFolders, setDriveFolders] = useState<Array<{ id: string; name: string }>>([]);
  const [driveFilesAll, setDriveFilesAll] = useState<
    Array<{ id: string; name: string; size: number; folderId: string | null; downloadUrl: string; contentType: string }>
  >([]);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [driveSearch, setDriveSearch] = useState("");
  const [driveUsageBytes, setDriveUsageBytes] = useState(0);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const val = bytes / Math.pow(1024, i);
    return `${val.toFixed(val >= 10 ? 0 : 1)} ${sizes[i]}`;
  };

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
  // Explore Coming-Soon overlay
  const [showExploreOverlay, setShowExploreOverlay] = useState(false);
  const [exploreStep, setExploreStep] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const seen = window.sessionStorage.getItem("exploreSeen");
      return seen ? 3 : 1;
    }
    return 1;
  });
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
        const totalBytes = files.reduce((acc: number, f: any) => acc + (f.size || 0), 0);
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

  const handleNewChat = async () => {
    const newId = await startNewConversation();
    setIsHistoryOpen(false);

    // If creation succeeds, navigate to the conversation URL; otherwise fall back to the generic chat route
    if (newId) {
      router.push(`/c/${newId}`);
    } else {
      router.push("/c");
    }
  };

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
    setIsHistoryOpen(false);
    // Navigate to the conversation URL
    router.push(`/c/${id}`);
  };

  const subscriptionStatus = userSubscription?.status;
  const hasActiveSubscription =
    subscriptionStatus === "active" || subscriptionStatus === "trialing";
  // No pre-wall overlay; gating is handled on the subscribe flow
  const needsSubscription = false;
  const autoAuth = searchParams.get("auth") === "1";

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden relative ${
        theme === "dark" ? "bg-gray-950 text-gray-50" : "bg-transparent text-gray-900"
      }`}
      style={{ fontSize: `${0.85 + textSizeSlider * 0.45}rem` }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{ backgroundColor: "#000", opacity: Math.max(0, Math.min(1, themeSlider)) * 0.6 }}
      />
      <div className="relative z-10 flex h-full flex-col">
        {/* Glassmorphism overlay for unauthenticated users (blocks clicks, blurs background) */}
        {!currentUser && (
          <div className="fixed inset-0 z-20 bg-white/50 backdrop-blur-md pointer-events-auto" />
        )}

        <header
          className={`fixed top-0 left-0 right-0 z-30 border-b border-transparent backdrop-blur-sm ${
            theme === "dark" ? "bg-gray-900/90" : "bg-white/95"
          } ${!currentUser ? "pointer-events-none select-none opacity-50" : ""}`}
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
                    aria-pressed={false}
                    onClick={() => {
                      setShowExploreOverlay(true);
                      setViewMode("chat");
                    }}
                    className={`pb-1 transition ${
                      viewMode === "explore"
                        ? "text-gray-900 border-b-2 border-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    Explore
                  </button>
                  {/* Cloud button removed per user request */}
                </div>
              </div>

              <div className="flex items-center gap-3" />
            </div>
          </div>
        </header>

        <main className="relative z-20 flex-1 min-h-0 overflow-hidden px-4 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3rem)' }}>
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden">
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
              />
            )}
            {viewMode === "cloud" && (
              <div
                className={`flex-1 min-h-0 flex flex-col gap-3 p-3 sm:p-4 ${
                  theme === "dark" ? "bg-gray-900 text-gray-50" : "bg-gray-50 text-gray-900"
                }`}
              >
                  <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Cloud</h2>
                  <div className="flex items-center gap-2 text-xs">
                      <span className={theme === "dark" ? "text-gray-200" : "text-gray-700"}>Storage</span>
                      <div className={`h-1.5 w-24 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}>
                      <div
                        className={`h-full rounded-full transition-all ${theme === "dark" ? "bg-gray-300" : "bg-gray-900"}`}
                          style={{ width: `${Math.min(100, (driveUsageBytes / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1)}%` }}
                      />
                    </div>
                      <span className={theme === "dark" ? "text-gray-200" : "text-gray-700"}>
                        {((driveUsageBytes / (5 * 1024 * 1024 * 1024)) * 100).toFixed(1)}%
                      </span>
                      <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
                        {formatBytes(driveUsageBytes)} / 5 GB
                      </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!currentUser) return;
                      const name = prompt("New folder name?");
                      if (!name?.trim()) return;
                      try {
                        await fetch("/api/drive/folders", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userId: currentUser.uid, name: name.trim() }),
                        });
                        loadDriveFolders();
                      } catch (error) {
                        console.error("Error creating drive folder:", error);
                      }
                    }}
                    className={`flex h-8 w-8 items-center justify-center transition ${theme === "dark" ? "text-gray-200 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                    aria-label="New folder"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </button>
                  <label
                    className={`flex h-8 w-8 items-center justify-center transition cursor-pointer ${theme === "dark" ? "text-gray-200 hover:text-white" : "text-gray-700 hover:text-gray-900"}`}
                    aria-label="Upload file"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !currentUser || !storage) return;
                        try {
                          setUploading(true);
                          const folder = driveFolderId || "root";
                          const storageRef = ref(storage, `drive/${currentUser.uid}/${folder}/${file.name}`);
                          await uploadBytes(storageRef, file);
                          const url = await getDownloadURL(storageRef);
                          await fetch("/api/drive/files", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              userId: currentUser.uid,
                              name: file.name,
                              folderId: driveFolderId,
                              downloadUrl: url,
                              size: file.size,
                              contentType: file.type || "application/octet-stream",
                            }),
                          });
                          loadDriveFiles();
                        } catch (error) {
                          console.error("Error uploading drive file:", error);
                        } finally {
                          setUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                    placeholder="Search documents"
                    className={`w-full sm:w-auto flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none ${
                      theme === "dark"
                        ? "border border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500 focus:border-gray-500"
                        : "border border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                    }`}
                  />
                </div>

                <div className="flex-1 overflow-auto">
                  {!isVaultOpen ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                        <button
                          onClick={() => setIsVaultOpen(true)}
                          className={`aspect-square rounded-[10px] border border-gray-200 ${
                            theme === "dark" ? "bg-gray-850 text-gray-100 border-gray-700" : "bg-white text-gray-900"
                          } shadow-sm flex flex-col items-center justify-center text-[11px] sm:text-[12px] font-semibold p-1.5 transition hover:-translate-y-0.5 hover:shadow`}
                        >
                          <div className="mb-0.5 h-5 w-7 rounded-[6px] bg-gray-100" />
                          <span className="text-center leading-tight">Vault</span>
                          <span className="text-[10px] font-semibold text-gray-500 leading-tight">Knowledge base</span>
                          <p className="mt-0.5 text-[9px] text-center font-normal text-gray-600 leading-snug">
                            Your persistent bio and knowledge base for +Agent. Edit to keep your context fresh.
                          </p>
                        </button>

                        <button
                          onClick={async () => {
                            if (!currentUser) return;
                            const name = prompt("New folder name?");
                            if (!name?.trim()) return;
                            try {
                              await fetch("/api/drive/folders", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: currentUser.uid, name: name.trim() }),
                              });
                              loadDriveFolders();
                              loadDriveFiles();
                            } catch (error) {
                              console.error("Error creating drive folder:", error);
                            }
                          }}
                          className={`aspect-square rounded-[10px] border border-dashed border-gray-300 ${
                            theme === "dark" ? "bg-gray-850 text-gray-100 border-gray-700" : "bg-white text-gray-900"
                          } shadow-sm flex flex-col items-center justify-center text-[11px] sm:text-[12px] font-semibold p-1.5 transition hover:-translate-y-0.5 hover:shadow`}
                        >
                          <div className="mb-0.5 h-5 w-7 rounded-[6px] bg-gray-100" />
                          <span className="text-center leading-tight">New folder</span>
                        </button>

                        {driveFolders
                          .filter((f) => f.name.toLowerCase().includes(driveSearch.toLowerCase()))
                          .map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => setDriveFolderId(folder.id)}
                              className={`aspect-square rounded-[10px] border border-gray-200 ${
                                theme === "dark" ? "bg-gray-850 text-gray-100 border-gray-700" : "bg-white text-gray-900"
                              } shadow-sm flex flex-col items-center justify-center text-[11px] sm:text-[12px] font-semibold p-1.5 transition hover:-translate-y-0.5 hover:shadow`}
                            >
                              <div className="mb-0.5 h-5 w-7 rounded-[6px] bg-gray-100" />
                              <span className="text-center leading-tight truncate px-1">{folder.name}</span>
                              <span className="text-[10px] font-semibold text-gray-500 leading-tight">Folder</span>
                            </button>
                          ))}

                        {driveFilesAll
                          .filter((f) => {
                            const matchesFolder = driveFolderId ? f.folderId === driveFolderId : true;
                            const matchesSearch = f.name.toLowerCase().includes(driveSearch.toLowerCase());
                            return matchesFolder && matchesSearch;
                          })
                          .map((file) => (
                            <div
                              key={file.id}
                              className={`aspect-square rounded-[10px] border border-gray-200 ${
                                theme === "dark" ? "bg-gray-850 text-gray-100 border-gray-700" : "bg-white text-gray-900"
                              } shadow-sm flex flex-col items-center justify-center text-[11px] sm:text-[12px] font-semibold p-1.5`}
                            >
                              <div className="mb-0.5 h-5 w-7 rounded-[6px] bg-gray-100" />
                              <span className="text-center leading-tight truncate px-1">{file.name}</span>
                              <span className="text-[10px] font-semibold text-gray-500 leading-tight">
                                {Math.round(file.size / 1024)} KB
                              </span>
                            </div>
                          ))}
                      </div>

                      <div className="mt-4 text-[11px] text-gray-500 flex items-center gap-2">
                        <span>Showing folders and files</span>
                      </div>
                    </>
                  ) : (
                    <div
                      className={`rounded-[12px] border ${
                        theme === "dark" ? "border-gray-800 bg-gray-900 text-gray-50" : "border-gray-200 bg-white text-gray-900"
                      } shadow-sm p-3 sm:p-4 space-y-3`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Vault</p>
                          <p className="text-base font-semibold">Knowledge base</p>
                          <p className="text-sm text-gray-600">
                            Central place to store your bio, notes, and files for +Agent to reference.
                          </p>
                        </div>
                        <button
                          onClick={() => setIsVaultOpen(false)}
                          className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                            theme === "dark"
                              ? "text-gray-200 hover:bg-gray-800"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          Back
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                          <span>Main bio</span>
                          <span className="text-[10px] text-gray-500">Plain text</span>
                        </div>
                        <textarea
                          value={vaultBio}
                          onChange={(e) => setVaultBio(e.target.value)}
                          placeholder="Write about you, your preferences, goals, and constraints..."
                          className={`min-h-[200px] w-full resize-vertical rounded-lg px-3 py-2 text-sm focus:outline-none ${
                            theme === "dark"
                              ? "border border-gray-800 bg-gray-900 text-gray-100 placeholder:text-gray-500 focus:border-gray-600"
                              : "border border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                          }`}
                        />
                        <div className="flex items-center justify-end gap-2 text-xs text-gray-500">
                          <span>{vaultBio.length} chars</span>
                          <button
                            onClick={async () => {
                              if (!currentUser || vaultSaving) return;
                              try {
                                setVaultSaving(true);
                                await fetch("/api/vault/bio", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userId: currentUser.uid, content: vaultBio }),
                                });
                              } catch (error) {
                                console.error("Error saving vault bio:", error);
                              } finally {
                                setVaultSaving(false);
                              }
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                              theme === "dark"
                                ? "bg-gray-800 text-gray-100 hover:bg-gray-700"
                                : "bg-gray-900 text-white hover:bg-black"
                            } ${(!currentUser || vaultSaving) ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {vaultSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!currentUser) return;
                              const name = prompt("Folder name?");
                              if (!name?.trim()) return;
                              try {
                                await fetch("/api/vault/folders", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ userId: currentUser.uid, name: name.trim() }),
                                });
                                loadFolders();
                              } catch (error) {
                                console.error("Error creating folder:", error);
                              }
                            }}
                            className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition ${
                              theme === "dark" ? "bg-gray-800 text-gray-100 hover:bg-gray-700" : "bg-gray-900 text-white hover:bg-black"
                            }`}
                          >
                            <FolderPlus className="h-4 w-4" />
                            New folder
                          </button>
                          <label
                            className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold cursor-pointer transition ${
                              theme === "dark" ? "bg-gray-800 text-gray-100 hover:bg-gray-700" : "bg-gray-900 text-white hover:bg-black"
                            }`}
                          >
                            <UploadCloud className="h-4 w-4" />
                            Upload file
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !currentUser || !storage) return;
                                try {
                                  setUploading(true);
                                  const folder = selectedFolderId || "root";
                                  const storageRef = ref(storage, `vault/${currentUser.uid}/${folder}/${file.name}`);
                                  await uploadBytes(storageRef, file);
                                  const url = await getDownloadURL(storageRef);
                                  await fetch("/api/vault/files", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      userId: currentUser.uid,
                                      name: file.name,
                                      folderId: selectedFolderId,
                                      downloadUrl: url,
                                      size: file.size,
                                      contentType: file.type || "application/octet-stream",
                                    }),
                                  });
                                  loadFiles(selectedFolderId);
                                } catch (error) {
                                  console.error("Error uploading file:", error);
                                } finally {
                                  setUploading(false);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
                            <span>Folders:</span>
                            <div className="flex items-center gap-1 overflow-x-auto">
                              <button
                                onClick={() => setSelectedFolderId(null)}
                                className={`rounded-full px-2 py-1 text-[11px] transition ${
                                  selectedFolderId === null
                                    ? theme === "dark"
                                      ? "bg-gray-800 text-gray-100"
                                      : "bg-gray-900 text-white"
                                    : theme === "dark"
                                      ? "bg-gray-850 text-gray-200"
                                      : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                All
                              </button>
                              {vaultFolders.map((f) => (
                                <button
                                  key={f.id}
                                  onClick={() => setSelectedFolderId(f.id)}
                                  className={`rounded-full px-2 py-1 text-[11px] transition ${
                                    selectedFolderId === f.id
                                      ? theme === "dark"
                                        ? "bg-gray-800 text-gray-100"
                                        : "bg-gray-900 text-white"
                                      : theme === "dark"
                                        ? "bg-gray-850 text-gray-200"
                                        : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {f.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {vaultFiles.length === 0 ? (
                            <p className="text-xs text-gray-500">No files yet.</p>
                          ) : (
                            vaultFiles.map((file) => (
                              <div
                                key={file.id}
                                className={`rounded-md border px-3 py-2 text-sm ${
                                  theme === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">{file.name}</p>
                                    <p className="text-xs text-gray-600 truncate">{file.downloadUrl}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-500">
                                    {Math.round(file.size / 1024)} KB
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {viewMode === "explore" && (
              <div className="flex-1 min-h-0 flex items-center justify-center text-gray-500">
                  {/* Explore feed disabled until launch */}
              </div>
            )}
          </div>
        </main>

        <StatusModal isVisible={showStatusModal} messages={statusMessages} onComplete={handleStatusComplete} />

        {isHistoryOpen && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
            <aside
              className={`absolute left-0 top-0 flex h-full w-[90%] max-w-sm flex-col shadow-2xl ring-1 ring-black/5 ${
                theme === "dark" ? "bg-gray-900/95 text-gray-50" : "bg-white/95 text-gray-900"
              }`}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-100"}`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400">History</p>
                  <p className="text-base font-semibold">{theme === "dark" ? "Conversation log" : "Conversation log"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className={`text-xs font-semibold transition ${theme === "dark" ? "text-gray-200 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                    onClick={handleNewChat}
                  >
                    + New Chat
                  </button>
                  <button
                    className={`rounded-full p-2 transition ${
                      theme === "dark" ? "text-gray-300 hover:bg-gray-800" : "text-gray-500 hover:bg-gray-100"
                    }`}
                    aria-label="Close history"
                    onClick={() => setIsHistoryOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className={`px-5 py-3 space-y-3 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-100"}`}>
                <input
                  type="text"
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search conversations"
                  className={`w-full rounded-[5px] border px-3 py-2 text-sm focus:outline-none ${
                    theme === "dark"
                      ? "border-gray-700 bg-gray-850 text-gray-100 placeholder:text-gray-500 focus:border-gray-400"
                      : "border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-900"
                  }`}
                />
                <div className="flex flex-col gap-2">
                  {/* Cloud storage option removed per user request */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center text-[11px] font-semibold">
                    <div className="flex items-center gap-2">
                      <Sun className={theme === "dark" ? "h-4 w-4 text-gray-400" : "h-4 w-4 text-gray-700"} />
                      <div className="relative flex items-center w-24 h-4">
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-gray-200 via-gray-400 to-gray-800 opacity-60" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={themeSlider}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setThemeSlider(next);
                            setTheme(next >= 0.5 ? "dark" : "light");
                          }}
                          className="relative w-full h-full cursor-pointer appearance-none bg-transparent"
                          aria-label="Toggle light or dark mode"
                        />
                      </div>
                      <Moon className={theme === "dark" ? "h-4 w-4 text-gray-200" : "h-4 w-4 text-gray-500"} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={theme === "dark" ? "text-gray-300 text-[10px]" : "text-gray-700 text-[10px]"}>
                        <span className="text-xs font-semibold">T</span>
                      </span>
                      <div className="relative flex items-center w-24 h-4">
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-gray-200 via-gray-400 to-gray-800 opacity-60" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={textSizeSlider}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setTextSizeSlider(Math.min(1, Math.max(0, next)));
                          }}
                          className="relative w-full h-full cursor-pointer appearance-none bg-transparent"
                          aria-label="Adjust text size"
                        />
                      </div>
                      <span className={theme === "dark" ? "text-gray-300 text-[10px]" : "text-gray-700 text-[10px]"}>
                        <span className="text-sm font-semibold">T</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 px-5 py-4">
                {conversationPreviews.length === 0 ? (
                  <p className={`px-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>No conversations yet.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {conversationPreviews
                      .filter((preview) => preview.title.toLowerCase().includes(historyQuery.toLowerCase()))
                      .map((preview) => (
                        <div
                          key={preview.id}
                          className={`group relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors ${
                            currentConversationId === preview.id
                              ? theme === "dark"
                                ? "bg-gray-800 font-medium text-gray-100"
                                : "bg-gray-100 font-medium text-gray-900"
                              : theme === "dark"
                                ? "text-gray-300 hover:bg-gray-800 hover:text-gray-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <MessageSquare className={`h-4 w-4 shrink-0 opacity-50 ${theme === "dark" ? "text-gray-300" : ""}`} />
                          
                          <button
                            onClick={() => handleSelectConversation(preview.id)}
                            className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
                            title={preview.title}
                          >
                            {preview.title || "Untitled"}
                          </button>

                          <div
                            className={`hidden items-center gap-1 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 rounded-md ml-auto pl-1 ${
                              theme === "dark" ? "bg-gray-800/70" : "bg-white/50 backdrop-blur-sm"
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextTitle = prompt("Rename conversation", preview.title);
                                if (nextTitle?.trim()) {
                                  renameConversation(preview.id, nextTitle.trim());
                                }
                              }}
                              className={`rounded p-1 ${
                                theme === "dark"
                                  ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                                  : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                              }`}
                              title="Rename"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeConversation(preview.id);
                              }}
                              className={`rounded p-1 ${
                                theme === "dark"
                                  ? "text-gray-300 hover:bg-red-900 hover:text-red-200"
                                  : "text-gray-400 hover:bg-red-100 hover:text-red-600"
                              }`}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className={`px-5 py-4 border-t ${theme === "dark" ? "border-gray-800" : "border-gray-100"}`}>
                <div className={`flex w-full items-center gap-3 px-1 py-2 text-left ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
                  <UserAvatar onDeviceChange={(deviceId) => setSelectedAudioDevice(deviceId)} />
                  <div>
                    <p className={`text-sm font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-900"}`}>{currentUser?.displayName || "Account"}</p>
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{currentUser?.email || "Signed in"}</p>
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
      {/* Explore Coming Soon Overlay */}
      {showExploreOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            {exploreStep === 1 && (
              <>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Explore is evolving
</h2>
                <p className="mb-6 text-sm text-gray-600">A brand-new AI-powered social feed is coming.<br/>Creators, artists, and sellers will be the first to shape it.</p>
                <button onClick={() => setExploreStep(2)} className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Next</button>
              </>
            )}
            {exploreStep === 2 && (
              <>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Designed for Creators, Artists & Sellers</h2>
                <ul className="mb-6 space-y-2 text-sm text-gray-700 list-disc pl-4">
                  <li>Creators – Build multi-model content</li>
                  <li>Artists – Showcase voice, visual, and written AI creations</li>
                  <li>Sellers – Sell digital & physical products with +AI identity protection</li>
                </ul>
                <button onClick={() => setExploreStep(3)} className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Next</button>
              </>
            )}
            {exploreStep === 3 && (
              <>
                <h2 className="mb-2 text-xl font-bold text-gray-900">Become a Founding Beta Member</h2>
                <p className="mb-6 text-sm text-gray-600">Get early access, influence the feed, and bring your audience. Limited seats for creators & early sellers.</p>
                <div className="flex flex-col gap-3">
                  <Link href="/beta-waitlist" className="flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white">Join Beta</Link>
                  <button onClick={() => {
                      setShowExploreOverlay(false);
                      window.sessionStorage.setItem("exploreSeen", "1");
                  }} className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
