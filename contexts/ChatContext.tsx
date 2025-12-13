"use client";

import { createContext, useContext, useState, useReducer, useRef, useEffect, ReactNode, useCallback, useMemo } from "react";
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
import type { LLMErrorCategory } from "@/lib/models/llmModels";

export type ChatState = "idle" | "listening" | "speaking" | "recording" | "processing";

export type ExecState =
  | "idle"
  | "validating"
  | "routing"
  | "preflight"
  | "tooling"
  | "streaming"
  | "stalled"
  | "retrying"
  | "finalizing"
  | "limited"
  | "error"
  | "cancelled"
  | "done";

// Action types for state machine
export type ExecAction = 
  | { type: 'START_VALIDATION'; requestId: string }
  | { type: 'BEGIN_ROUTING' }
  | { type: 'BEGIN_PREFLIGHT' }
  | { type: 'START_STREAMING' }
  | { type: 'TOKEN_RECEIVED'; token: string; estimatedTokens: number }
  | { type: 'MARK_STALLED' }
  | { type: 'RESUME_STREAMING' }
  | { type: 'RETRY' }
  | { type: 'COMPLETE'; reason?: string }
  | { type: 'FAIL'; error: string; category?: LLMErrorCategory }
  | { type: 'CANCEL' }
  | { type: 'HIT_LIMIT' }
  | { type: 'RESET' };

// Execution state data with metadata
export interface ExecStateData {
  state: ExecState;
  requestId: string | null;
  error: string | null;
  errorCategory: LLMErrorCategory | null;
  tokenCount: number;
  charCount: number;
  tokenBudget: number;
  charBudget: number;
}

type PendingSubmission = {
  text: string;
  requestId?: string;
};

interface ChatContextType {
  state: ChatState;
  setState: (state: ChatState) => void;
  execState: ExecState;
  execData: ExecStateData;
  dispatchExec: React.Dispatch<ExecAction>;
  requestId: string | null;
  setRequestId: (id: string | null) => void;
  canSubmit: boolean;
  markTokenActivity: () => void;
  abortController: AbortController | null;
  setAbortController: (ctrl: AbortController | null) => void;
  statusLabel: string | null;
  setStatusLabel: (text: string | null) => void;
  activeRequestId: string | null;
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
    options?: { 
      avatarType?: "user" | "neural"; 
      avatarUrl?: string; 
      model?: string; 
      tokenCount?: number;
      vaultRefs?: import("@/types/conversation").VaultRef[];
    }
  ) => Promise<string | null>;
  pendingQueue: PendingSubmission[];
  enqueueSubmission: (item: PendingSubmission) => void;
  shiftSubmission: () => PendingSubmission | undefined;
  clearQueue: () => void;
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

// Helper: Get token budget based on subscription tier
export function getTokenBudget(subscription?: string | null): number {
  if (!subscription || subscription === "free") return 10000; // Free tier
  if (subscription === "plus" || subscription === "paid") return 100000; // Paid tier
  if (subscription === "super") return 500000; // Super tier
  return 10000; // Default to free
}

// Helper: Get character budget for vault context based on tier
export function getCharBudget(subscription?: string | null): number {
  if (!subscription || subscription === "free") return 1500; // Free tier
  if (subscription === "plus" || subscription === "paid") return 6000; // Paid tier
  if (subscription === "super") return 12000; // Super tier
  return 1500; // Default to free
}

// Helper: Estimate token count from text (rough approximation: 1 token ≈ 4 chars)
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// Helper: Detect natural stop signals in streaming text
export function detectSemanticStop(text: string, tokenCount: number): boolean {
  if (!text || text.length < 50) return false; // Too short to determine
  
  const trimmed = text.trim();
  
  // Check for sentence endings
  const hasSentenceEnding = /[.!?]\s*$/.test(trimmed);
  
  // Check for code fence closures
  const hasCodeFenceClosure = /```\s*$/.test(trimmed);
  
  // Count sentences (rough approximation)
  const sentenceCount = (trimmed.match(/[.!?]\s+/g) || []).length;
  
  // Natural stop if:
  // 1. Has sentence ending AND has multiple sentences AND token count > 100
  // 2. OR has code fence closure
  // 3. OR very long response (>2000 tokens) with sentence ending
  
  if (hasCodeFenceClosure) return true;
  if (tokenCount > 2000 && hasSentenceEnding) return true;
  if (sentenceCount >= 3 && hasSentenceEnding && tokenCount > 100) return true;
  
  return false;
}

// Execution state reducer with transition validation
function execReducer(state: ExecStateData, action: ExecAction): ExecStateData {
  // Helper to check if current state allows transition
  const canTransitionFrom = (allowedStates: ExecState[]): boolean => {
    return allowedStates.includes(state.state);
  };

  // Log invalid transitions for debugging
  const logInvalidTransition = (action: ExecAction, allowedFrom: ExecState[]) => {
    console.warn(
      `[State Machine] Invalid transition: ${state.state} → ${action.type}`,
      `\nAllowed from: [${allowedFrom.join(', ')}]`
    );
  };

  switch (action.type) {
    case 'START_VALIDATION': {
      const allowedFrom: ExecState[] = ['idle', 'done', 'error', 'limited', 'cancelled'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return {
        ...state,
        state: 'validating',
        requestId: action.requestId,
        error: null,
        errorCategory: null,
        tokenCount: 0,
        charCount: 0,
      };
    }

    case 'BEGIN_ROUTING': {
      const allowedFrom: ExecState[] = ['validating'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { ...state, state: 'routing' };
    }

    case 'BEGIN_PREFLIGHT': {
      const allowedFrom: ExecState[] = ['routing'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { ...state, state: 'preflight' };
    }

    case 'START_STREAMING': {
      const allowedFrom: ExecState[] = ['preflight', 'tooling', 'retrying'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { ...state, state: 'streaming' };
    }

    case 'TOKEN_RECEIVED': {
      const allowedFrom: ExecState[] = ['streaming'];
      if (!canTransitionFrom(allowedFrom)) {
        // Silently ignore tokens received in other states
        return state;
      }
      
      const newTokenCount = state.tokenCount + action.estimatedTokens;
      const newCharCount = state.charCount + action.token.length;
      
      // Check if budget exceeded (use 95% threshold to give some buffer)
      if (newTokenCount > state.tokenBudget * 0.95) {
        // Will transition to HIT_LIMIT, but update counts first
        return {
          ...state,
          tokenCount: newTokenCount,
          charCount: newCharCount,
        };
      }
      
      return {
        ...state,
        tokenCount: newTokenCount,
        charCount: newCharCount,
      };
    }

    case 'MARK_STALLED': {
      const allowedFrom: ExecState[] = ['streaming'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { ...state, state: 'stalled' };
    }

    case 'RESUME_STREAMING': {
      const allowedFrom: ExecState[] = ['stalled'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { ...state, state: 'streaming' };
    }

    case 'RETRY': {
      const allowedFrom: ExecState[] = ['stalled', 'error'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { ...state, state: 'retrying', error: null, errorCategory: null };
    }

    case 'COMPLETE': {
      const allowedFrom: ExecState[] = ['streaming', 'stalled'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return { 
        ...state, 
        state: 'done',
        requestId: null,
      };
    }

    case 'FAIL': {
      const allowedFrom: ExecState[] = ['validating', 'routing', 'preflight', 'tooling', 'streaming', 'stalled', 'retrying'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return {
        ...state,
        state: 'error',
        error: action.error,
        errorCategory: action.category ?? null,
        requestId: null,
      };
    }

    case 'CANCEL': {
      const allowedFrom: ExecState[] = ['validating', 'routing', 'preflight', 'tooling', 'streaming', 'stalled', 'retrying'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return {
        ...state,
        state: 'cancelled',
        requestId: null,
      };
    }

    case 'HIT_LIMIT': {
      const allowedFrom: ExecState[] = ['validating', 'preflight', 'streaming', 'stalled'];
      if (!canTransitionFrom(allowedFrom)) {
        logInvalidTransition(action, allowedFrom);
        return state;
      }
      return {
        ...state,
        state: 'limited',
        requestId: null,
      };
    }

    case 'RESET': {
      // RESET can happen from any state (emergency escape hatch)
      return {
        ...state,
        state: 'idle',
        requestId: null,
        error: null,
        errorCategory: null,
        tokenCount: 0,
        charCount: 0,
      };
    }

    default: {
      console.warn('[State Machine] Unknown action type:', action);
      return state;
    }
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { currentUser, userSubscription } = useAuth();
  const [state, setState] = useState<ChatState>("idle");
  
  // Get budgets based on subscription tier
  const tokenBudget = useMemo(() => 
    getTokenBudget(userSubscription?.planId), 
    [userSubscription?.planId]
  );
  const charBudget = useMemo(() => 
    getCharBudget(userSubscription?.planId), 
    [userSubscription?.planId]
  );
  
  const [execData, dispatchExec] = useReducer(execReducer, {
    state: 'idle',
    requestId: null,
    error: null,
    errorCategory: null,
    tokenCount: 0,
    charCount: 0,
    tokenBudget,
    charBudget,
  });
  const [requestId, setRequestId] = useState<string | null>(null);
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
  const lastTokenAtRef = useRef<number | null>(null);
  const [pendingQueue, setPendingQueue] = useState<PendingSubmission[]>([]);
  const [abortController, setAbortControllerState] = useState<AbortController | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

  const addAudioBuffer = (buffer: Blob) => {
    audioBuffersRef.current.push(buffer);
  };

  const clearAudioBuffers = () => {
    audioBuffersRef.current = [];
  };

  const setPreferences = (prefs: Partial<ChatContextType["preferences"]>) => {
    setPreferencesState((prev) => ({ ...prev, ...prefs }));
  };

  const enqueueSubmission = (item: PendingSubmission) => {
    setPendingQueue((prev) => [...prev, item]);
  };

  const shiftSubmission = () => {
    let next: PendingSubmission | undefined;
    setPendingQueue((prev) => {
      if (prev.length === 0) return prev;
      const [, ...rest] = prev;
      next = prev[0];
      return rest;
    });
    return next;
  };

  const clearQueue = () => setPendingQueue([]);

  const setAbortController = (ctrl: AbortController | null) => {
    if (abortController) {
      abortController.abort();
    }
    setAbortControllerState(ctrl);
  };

  const canSubmit = useMemo(() => {
    return ["idle", "done", "error", "limited", "cancelled"].includes(execData.state) && !requestId && !activeRequestId;
  }, [execData.state, requestId, activeRequestId]);

  const markTokenActivity = () => {
    lastTokenAtRef.current = Date.now();
    if (execData.state === "stalled") {
      dispatchExec({ type: 'RESUME_STREAMING' });
    }
  };

  useEffect(() => {
    if (execData.state !== "streaming") return;
    const id = window.setInterval(() => {
      const last = lastTokenAtRef.current;
      if (!last) return;
      if (Date.now() - last > 2000) {
        dispatchExec({ type: 'MARK_STALLED' });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [execData.state]);

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
    const hadLocalCache = cached.length > 0;
    if (hadLocalCache) {
      setConversationHistory(cached);
    }
    let sawServerSnapshot = false;

    try {
      const unsubscribe = subscribeToMessages(
        currentConversationId,
        (messages, meta) => {
          // Prevent: cached messages -> empty fromCache snapshot -> cached messages again (blink)
          if (hadLocalCache && !sawServerSnapshot && messages.length === 0 && meta?.fromCache) {
            return;
          }

          if (!meta?.fromCache) {
            sawServerSnapshot = true;
          }

          setConversationHistory(messages);
          cacheConversationMessages(currentUser.uid, currentConversationId, messages);
        },
        (error) => {
          // Avoid wiping the UI on transient snapshot failures (this can cause a "blink" on refresh).
          // Keep whatever we have (often local cache) and let the user retry via refresh/navigation.
          console.warn("Message subscription failed:", error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.warn("Message subscription failed:", error);
    }
  }, [currentUser, currentConversationId]);

  const startNewConversation = useCallback(async () => {
    // Clear history immediately
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
      // Clear current conversation ID first to trigger cleanup
      const oldConversationId = currentConversationId;
      setCurrentConversationId(null);
      
      // Clear cached messages from old conversation
      if (oldConversationId && typeof window !== "undefined") {
        const cacheKey = `chat:messages:${currentUser.uid}:${oldConversationId}`;
        window.localStorage.removeItem(cacheKey);
      }
      
      // Create new conversation
      const newConversationId = await createConversationDoc(currentUser.uid, selectedModel, "Untitled");
      setCurrentConversationId(newConversationId);
      return newConversationId;
    } catch (error) {
      console.error("Failed to start new conversation", error);
      return null;
    }
  }, [currentUser, selectedModel, currentConversationId]);

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
      options?: { 
        avatarType?: "user" | "neural"; 
        avatarUrl?: string; 
        model?: string; 
        tokenCount?: number;
        vaultRefs?: import("@/types/conversation").VaultRef[];
      }
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
        vaultRefs: options?.vaultRefs,
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
        execState: execData.state,
        execData,
        dispatchExec,
        requestId,
        setRequestId,
        activeRequestId,
        canSubmit,
        markTokenActivity,
        abortController,
        setAbortController,
        statusLabel,
        setStatusLabel,
        pendingQueue,
        enqueueSubmission,
        shiftSubmission,
        clearQueue,
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
