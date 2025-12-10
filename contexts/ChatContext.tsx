"use client";

import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToConversations,
  subscribeToMessages,
  createConversation as createConversationDoc,
  appendConversationMessage,
  updateConversationTitle,
  deleteConversation,
  loadCachedConversationMessages,
  loadCachedConversationPreviews,
  cacheConversationMessages,
} from "@/lib/conversationService";
import type { ConversationMessage, ConversationPreview } from "@/types/conversation";
import { nanoid } from "nanoid";

export type ChatState = "idle" | "listening" | "speaking" | "recording" | "processing";

interface ChatContextType {
  state: ChatState;
  setState: (state: ChatState) => void;
  lastTranscript: string;
  setLastTranscript: (transcript: string) => void;
  lastPrompt: string;
  setLastPrompt: (prompt: string) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  audioBuffers: Blob[];
  addAudioBuffer: (buffer: Blob) => void;
  clearAudioBuffers: () => void;
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  inputMode: "voice" | "text";
  setInputMode: (mode: "voice" | "text") => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  isActivated: boolean;
  setIsActivated: (activated: boolean) => void;
  showGreeting: boolean;
  setShowGreeting: (show: boolean) => void;
  conversationHistory: ConversationMessage[];
  conversationPreviews: ConversationPreview[];
  currentConversationId: string | null;
  startNewConversation: () => Promise<string | null>;
  loadConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => Promise<void>;
  removeConversation: (conversationId: string) => Promise<void>;
  appendMessageToConversation: (
    role: "user" | "assistant",
    content: string,
    options?: { avatarType?: "user" | "neural"; avatarUrl?: string; model?: string; tokenCount?: number }
  ) => Promise<string | null>;
  preferences: {
    autoAdvance: boolean;
    showTranscript: boolean;
  };
  setPreferences: (prefs: Partial<ChatContextType["preferences"]>) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);
const LOCAL_CONVERSATION_KEY = "chat:local-conversation";

function generateTitleFromText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "Untitled";
  return trimmed.slice(0, 48) + (trimmed.length > 48 ? "…" : "");
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<ChatState>("idle");
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastPrompt, setLastPrompt] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-5.1");
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [isListening, setIsListening] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [conversationPreviews, setConversationPreviews] = useState<ConversationPreview[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const audioBuffersRef = useRef<Blob[]>([]);
  const [preferences, setPreferencesState] = useState({
    autoAdvance: true,
    showTranscript: true,
  });

  const addAudioBuffer = (buffer: Blob) => {
    audioBuffersRef.current.push(buffer);
  };

  const clearAudioBuffers = () => {
    audioBuffersRef.current = [];
  };

  const setPreferences = (prefs: Partial<ChatContextType["preferences"]>) => {
    setPreferencesState((prev) => ({ ...prev, ...prefs }));
  };

  // Subscribe to conversations when currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setConversationPreviews([]);
      setCurrentConversationId(null);
      return;
    }

    const unsubscribe = subscribeToConversations(currentUser.uid, (list) => {
      setConversationPreviews(list);
    });
    return unsubscribe;
  }, [currentUser]);

  // When loadConversation is called, it just updates the ID.
  // We should probably also navigate if we were inside the context itself, but navigation is usually handled by the UI component.
  // Ideally, the URL is the source of truth for currentConversationId.
  
  // Let's make currentConversationId controllable or derived if possible, but for now we sync it.


  // Subscribe to messages for currently selected conversation
  useEffect(() => {
    if (!currentUser || !currentConversationId) {
      setConversationHistory([]);
      return;
    }

    const cached = loadCachedConversationMessages(currentUser.uid, currentConversationId);
    if (cached.length) {
      setConversationHistory(cached);
    }

    try {
      const unsubscribe = subscribeToMessages(
        currentConversationId,
        (messages) => {
          setConversationHistory(messages);
          cacheConversationMessages(currentUser.uid, currentConversationId, messages);
        },
        (error) => {
          console.warn("Message subscription failed, resetting conversation:", error);
          setConversationHistory([]);
          setCurrentConversationId(null);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn("Message subscription failed:", error);
    }
  }, [currentUser, currentConversationId]);

  const startNewConversation = useCallback(async () => {
    setConversationHistory([]);

    // If the user is not signed in, reset the current conversation and clear any cached local history
    if (!currentUser) {
      setCurrentConversationId(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_CONVERSATION_KEY);
      }
      return null;
    }

    try {
      const newConversationId = await createConversationDoc(currentUser.uid, selectedModel, "Untitled");
      setCurrentConversationId(newConversationId);
      return newConversationId;
    } catch (error) {
      console.error("Failed to start new conversation", error);
      return null;
    }
  }, [currentUser, selectedModel]);

  const loadConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  const renameConversation = useCallback(async (conversationId: string, title: string) => {
    try {
      await updateConversationTitle(conversationId, title);
    } catch (error) {
      console.error("Failed to rename conversation", error);
    }
  }, []);

  const removeConversation = useCallback(async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      if (currentConversationId === conversationId) {
        await startNewConversation();
      }
    } catch (error) {
      console.error("Failed to delete conversation", error);
    }
  }, [currentConversationId, startNewConversation]);

  const ensureConversation = useCallback(
    async (seedContent?: string) => {
      if (!currentUser) return null;
      if (currentConversationId) return currentConversationId;
      const title = seedContent ? generateTitleFromText(seedContent) : "Untitled";
      try {
        const newId = await createConversationDoc(currentUser.uid, selectedModel, title);
        setCurrentConversationId(newId);
        return newId;
      } catch (error) {
        console.error("Failed to create conversation", error);
        return null;
      }
    },
    [currentConversationId, currentUser, selectedModel]
  );

  const appendMessageToConversation = useCallback(
    async (
      role: "user" | "assistant",
      content: string,
      options?: { avatarType?: "user" | "neural"; avatarUrl?: string; model?: string; tokenCount?: number }
    ) => {
      const optimisticEntry: ConversationMessage = {
        id: nanoid(),
        conversationId: currentConversationId ?? "",
        sender: role,
        content,
        type: "text",
        timestamp: Date.now(),
        avatarType: options?.avatarType,
        avatarUrl: options?.avatarUrl,
        model: options?.model ?? (role === "assistant" ? selectedModel : undefined),
        tokenCount: options?.tokenCount,
      };

      if (!currentUser) {
        setConversationHistory((prev) => {
          const next = [...prev, optimisticEntry];
          if (typeof window !== "undefined") {
            window.localStorage.setItem(LOCAL_CONVERSATION_KEY, JSON.stringify(next));
          }
          return next;
        });
        return null;
      }

      // Optimistically add message to state to ensure immediate visibility
      setConversationHistory((prev) => [...prev, optimisticEntry]);

      const conversationId = await ensureConversation(content);
      if (!conversationId) return null;
      try {
        await appendConversationMessage(conversationId, {
          conversationId,
          sender: role,
          content,
          type: "text",
          avatarType: options?.avatarType,
          avatarUrl: options?.avatarUrl,
          model: options?.model ?? (role === "assistant" ? selectedModel : undefined),
          tokenCount: options?.tokenCount,
          fileRefs: [],
        });
        return conversationId;
      } catch (error) {
        console.error("Failed to append message", error);
        // Rollback optimistic update on error if needed, but for now we rely on re-sync
        return null;
      }
    },
    [currentConversationId, currentUser, ensureConversation, selectedModel]
  );

  return (
    <ChatContext.Provider
      value={{
        state,
        setState,
        lastTranscript,
        setLastTranscript,
        lastPrompt,
        setLastPrompt,
        isRecording,
        setIsRecording,
        isProcessing,
        setIsProcessing,
        selectedModel,
        setSelectedModel,
        inputMode,
        setInputMode,
        isListening,
        setIsListening,
        isActivated,
        setIsActivated,
        showGreeting,
        setShowGreeting,
        conversationHistory,
        conversationPreviews,
        currentConversationId,
        startNewConversation,
        loadConversation,
        renameConversation,
        removeConversation,
        appendMessageToConversation,
        audioBuffers: audioBuffersRef.current,
        addAudioBuffer,
        clearAudioBuffers,
        preferences,
        setPreferences,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
