"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import VIIMAnimation from "./VIIMAnimation";
import { useVIIMRecorder } from "./VIIMRecorder";
import { useChat, estimateTokenCount, detectSemanticStop, getCharBudget } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { StallActionsBar } from "@/components/StallActionsBar";
import { VaultAutocomplete } from "@/components/vault/VaultAutocomplete";
import { ContextSourcesBar } from "@/components/vault/ContextSourcesBar";
import { useVaultAutocomplete } from "@/hooks/useVaultAutocomplete";
import { resolveVaultContext, buildPromptWithVault } from "@/lib/vaultPolicy";
import type { VaultRef } from "@/types/conversation";
import type { ChatState } from "@/contexts/ChatContext";
import { GreetingBubble } from "./GreetingBubble";
import { llmModels, getModelById } from "@/lib/models/modelRegistry";
import type { ModelResponse } from "@/lib/models/modelRegistry";
import { nanoid } from "nanoid";
import {
  Send,
  Camera,
  Image,
  Clipboard,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  MessageSquarePlus,
  MoreHorizontal,
  Search,
  Square,
  Lock,
} from "lucide-react";
import { processWhisper } from "@/lib/models/whisper";
import {
  processGPT,
  processGPTCode,
  processClaude,
  processSonnet,
  processGemini,
  LLMErrorCategory
} from "@/lib/models/llmModels";
import { processElevenLabs, processSuno, processHume, processRunway } from "@/lib/models/audioModels";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotification } from "@/contexts/NotificationContext";

const ASSISTANT_COLLAPSE_CHAR_THRESHOLD = 1200;
const ASSISTANT_COLLAPSE_HEIGHT_THRESHOLD_PX = 280;
const ASSISTANT_COLLAPSE_HEAD_LINES = 3;
const VOICE_HOLD_DELAY_MS = 200;
const VOICE_CANCEL_THRESHOLD_PX = 70;
const MAX_STREAM_CHARS = 8000; // soft stop

type VoiceGestureState = "idle" | "holding" | "recording" | "locked" | "canceling" | "sending";

interface NeuralBoxProps {
  audioDeviceId?: string;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  className?: string;
  variant?: "assistant" | "capture";
  onAudioCapture?: (audioBlob: Blob) => Promise<void> | void;
  onStateChange?: (state: ChatState) => void;
  showInputPanel?: boolean;
  forcePromptVisible?: boolean;
  showKeyboardMock?: boolean;
  blurInput?: boolean;
  disableInteractions?: boolean;
  openAuthOnMount?: boolean;
}

const AnimatedContent = ({
  text,
  isUser,
  messageId,
  animate = true,
  stopSignal = 0,
}: {
  text: string;
  isUser: boolean;
  messageId: string;
  animate?: boolean;
  stopSignal?: number;
}) => {
  const [visibleText, setVisibleText] = useState("");
  const isMounted = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  // Allow the UI to "stop printing" and reveal the full text immediately
  useEffect(() => {
    if (isUser) return;
    if (!animate) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setVisibleText(text || "");
  }, [stopSignal]);

  useEffect(() => {
    // If this is user content or animation is disabled, show full text immediately
    if (isUser || !animate) {
      setVisibleText(text || "");
      return;
    }

    if (!text) {
      setVisibleText("");
      return;
    }

    // Fresh animation for new assistant output
    setVisibleText("");

    let currentIndex = 0;
    const targetText = text;

    const typeNextChar = () => {
      if (!isMounted.current) return;
      if (currentIndex >= targetText.length) return;

      const chunk = 1; // slower, smoother
      const nextIndex = Math.min(currentIndex + chunk, targetText.length);
      setVisibleText(targetText.slice(0, nextIndex));
      currentIndex = nextIndex;

      const delay = 35 + Math.random() * 40; // slower pacing
      typingTimeoutRef.current = window.setTimeout(typeNextChar, delay);
    };

    typingTimeoutRef.current = window.setTimeout(typeNextChar, 20);
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [text, isUser, animate, messageId]);

  const content = isUser || !animate ? text : visibleText;

  return (
    <div className="relative chat-response">
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => (
            <p 
              className={`whitespace-pre-wrap mb-2 text-[15px] sm:text-[16px] leading-[1.4] sm:leading-[1.45] ${
                isUser ? "text-white" : "text-gray-900"
              }`} 
              {...props} 
            />
          ),
          li: ({ node, ...props }) => (
            <li 
              className={`whitespace-pre-wrap mb-2 text-[15px] sm:text-[16px] leading-[1.4] sm:leading-[1.45] ${
                isUser ? "text-white" : "text-gray-900"
              }`} 
              {...props} 
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className={`mb-2.5 pl-5 list-disc ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className={`mb-2.5 pl-5 list-decimal ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1 className={`mt-4 mb-1.5 text-xl font-bold leading-[1.25] ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className={`mt-4 mb-1.5 text-lg font-bold leading-[1.25] ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className={`mt-4 mb-1.5 text-base font-bold leading-[1.25] ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
          ),
          code: ({ node, className, ...props }: any) => {
            const isInline = !className?.includes('language-');
            return isInline ? (
              <code className="bg-gray-100 text-gray-900 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="block bg-gray-900 text-gray-100 px-4 py-3 rounded-lg text-sm font-mono overflow-x-auto my-2" {...props} />
            );
          },
        }}
      >
        {content || " "}
      </ReactMarkdown>
    </div>
  );
};

function buildCollapsedPreview(text: string) {
  const normalized = (text ?? "").replace(/\r\n/g, "\n").trimEnd();
  const lines = normalized.split("\n");
  const head = lines.slice(0, ASSISTANT_COLLAPSE_HEAD_LINES).join("\n").trimEnd();
  const tail = [...lines].reverse().find((l) => l.trim().length > 0) ?? "";
  const headHasTail = head.includes(tail) || tail.trim().length === 0;
  return { head, tail, headHasTail };
}

function extractPlusTokens(text: string): string[] {
  const matches = [...text.matchAll(/(?:^|\s)\+([A-Za-z0-9_-]+)/g)];
  return matches.map((m) => m[1]);
}

function buildPrompt(userText: string, plusTokens: string[]): string {
  const blocks: string[] = [];
  blocks.push("System: You are a helpful, concise assistant. Keep answers safe and clear.");
  blocks.push("Safety: Avoid harmful, private, or disallowed content.");
  if (plusTokens.length) {
    blocks.push(`User Context (from +): ${plusTokens.join(", ")}`);
  }
  blocks.push("Task:");
  blocks.push(userText.trim());
  return blocks.join("\n\n");
}

export function NeuralBox({
  audioDeviceId,
  onTranscript,
  onResponse,
  className = "",
  variant = "assistant",
  onAudioCapture,
  onStateChange,
  showInputPanel = true,
  forcePromptVisible = false,
  showKeyboardMock = false,
  blurInput = false,
  disableInteractions = false,
  openAuthOnMount = false,
}: NeuralBoxProps) {
  const {
    state,
    setState,
    execState,
    execData,
    dispatchExec,
    requestId,
    setRequestId,
    canSubmit,
    markTokenActivity,
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
    lastPrompt,
    setLastTranscript,
    setLastPrompt,
    conversationHistory,
    appendMessageToConversation,
    currentConversationId,
    pendingQueue,
    enqueueSubmission,
    shiftSubmission,
    abortController,
    setAbortController,
    statusLabel,
    setStatusLabel,
  } = useChat();

  const { currentUser, userSubscription } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [vaultRefs, setVaultRefs] = useState<VaultRef[]>([]);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [hasActivatedOnce, setHasActivatedOnce] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Vault autocomplete hook
  const autocomplete = useVaultAutocomplete(textareaRef, (token, item) => {
    // Add vault ref when token is inserted
    const newRef: VaultRef = {
      id: item.id,
      type: item.type,
      name: item.name,
      token,
    };
    setVaultRefs(prev => [...prev, newRef]);
  });
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Track which messages existed when the conversation was opened; only animate newly-added assistant messages
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const [stopPrintSignal, setStopPrintSignal] = useState(0);
  const [collapsedById, setCollapsedById] = useState<Record<string, boolean>>({});
  const [tallById, setTallById] = useState<Record<string, boolean>>({});
  const manualOverrideIdsRef = useRef<Set<string>>(new Set());
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [usageWarning, setUsageWarning] = useState<string | null>(null);
  const [modelQuery, setModelQuery] = useState("");
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>("+Agent");
  const thinkingMessages = useMemo(
    () => ["Thinking...", "Preparing response...", "Synthesizing...", "Almost there..."],
    []
  );
  const [thinkingIndex, setThinkingIndex] = useState(0);

  // Streaming State
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [assistantStatusText, setAssistantStatusText] = useState<string | null>(null);
  const lastTokenAtRef = useRef<number | null>(null);
  const firstTokenSeenRef = useRef(false);

  // Press-and-hold voice gesture (independent of text mode)
  const [voiceGestureState, setVoiceGestureState] = useState<VoiceGestureState>("idle");
  const [recordStartAt, setRecordStartAt] = useState<number | null>(null);
  const [recordElapsedMs, setRecordElapsedMs] = useState(0);
  const pressTimerRef = useRef<number | null>(null);
  const pressPointerIdRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const discardNextAudioRef = useRef(false);
  const pressBecameRecordingRef = useRef(false);


  useEffect(() => {
    if (state !== "processing") return;
    const id = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 1600);
    return () => clearInterval(id);
  }, [state, thinkingMessages.length]);

  useEffect(() => {
    // If we are streaming and tokens stall, briefly re-show a soft status.
    if (state !== "speaking") return;
    const id = window.setInterval(() => {
      if (state !== "speaking") return;
      if (!firstTokenSeenRef.current) return;
      const last = lastTokenAtRef.current;
      if (!last) return;
      const stalled = Date.now() - last > 2000;
      if (stalled && !assistantStatusText) {
        setAssistantStatusText("Still working…");
        dispatchExec({ type: 'MARK_STALLED' });
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [state, assistantStatusText]);

  const renderAvatar = (sender: "user" | "assistant", avatarUrl?: string) => {
    if (avatarUrl) {
      return <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />;
    }
    if (sender === "user") {
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
          U
        </div>
      );
    }
    return (
      <div className="flex h-6 w-6 items-center justify-center flex-shrink-0">
        <VIIMAnimation state={state} size="custom" customSize={24} container="none" />
      </div>
    );
  };

  // The model roster mirrors the LLM picker from the Cursor mock
  const availableModels = llmModels;
  const filteredModels = useMemo(() => {
    const query = modelQuery.trim().toLowerCase();
    if (!query) return availableModels;
    return availableModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query)
    );
  }, [availableModels, modelQuery]);
  const currentModel = getModelById(selectedModel) || availableModels[0];

  // Audio recording setup
  const { isRecording, startRecording, stopRecording, getAudioStream } = useVIIMRecorder({
    audioDeviceId,
    onStreamReady: (stream) => {
      if (stream) {
        setState("listening");
        setIsListening(true);
      }
    },
    onAudioData: async (audioBlob) => {
      if (discardNextAudioRef.current) {
        discardNextAudioRef.current = false;
        pressBecameRecordingRef.current = false;
        setVoiceGestureState("idle");
        setRecordStartAt(null);
        setRecordElapsedMs(0);
        setIsListening(false);
        setState("idle");
        return;
      }

      setIsListening(false);
      setState("processing");
      pressBecameRecordingRef.current = false;
      setRecordStartAt(null);
      setRecordElapsedMs(0);
      setVoiceGestureState("sending");

      if (onAudioCapture) {
        try {
          await onAudioCapture(audioBlob);
        } catch (error) {
          console.error("NeuralBox capture handler error:", error);
        }
      }

      if (variant === "capture") {
        setState("idle");
        setVoiceGestureState("idle");
        return;
      }
      
      try {
        const transcription = await processWhisper(audioBlob);

        if (transcription.text) {
          const trimmedTranscript = transcription.text.trim();
          setLastTranscript(trimmedTranscript);
          onTranscript?.(trimmedTranscript);
          if (trimmedTranscript) {
            await appendMessageToConversation("user", trimmedTranscript, { avatarType: "user" });
          }
          const voiceReqId = nanoid();
          setRequestId(voiceReqId);
          dispatchExec({ type: 'START_VALIDATION', requestId: voiceReqId });
          dispatchExec({ type: 'BEGIN_ROUTING' });
          dispatchExec({ type: 'BEGIN_PREFLIGHT' });
          await handleLLMRequest(selectedModel, transcription.text, voiceReqId);

        } else {
          setState("idle");
          setVoiceGestureState("idle");
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        setState("idle");
        setVoiceGestureState("idle");
      }
    },
    onError: (error) => {
      console.error("Recording error:", error);
      setState("idle");
      setIsListening(false);
      setVoiceGestureState("idle");
    },
  });

  // Unified LLM Request Handler with Streaming
  const handleLLMRequest = async (modelId: string, text: string, reqId: string) => {
    if (limitReached) return;

    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setAbortController(abortController);

    setStreamingContent("");
    setState("speaking"); // Use speaking state to indicate streaming
    dispatchExec({ type: 'START_STREAMING' });
    setRequestId(reqId);
    markTokenActivity();
    firstTokenSeenRef.current = false;
    lastTokenAtRef.current = Date.now();
    setAssistantStatusText(thinkingMessages[thinkingIndex] || "Analyzing…");

    try {
        const onToken = (token: string) => {
            if (!firstTokenSeenRef.current) {
              firstTokenSeenRef.current = true;
            }
            lastTokenAtRef.current = Date.now();
            markTokenActivity();
            // Hide narrative status as soon as tokens start/resume.
            setAssistantStatusText(null);
            
            // Dispatch token received action for budget tracking
            const estimated = estimateTokenCount(token);
            dispatchExec({ type: 'TOKEN_RECEIVED', token, estimatedTokens: estimated });
            
            setStreamingContent((prev) => {
              const next = prev + token;
              
              // Check character limit
              if (next.length > MAX_STREAM_CHARS) {
                abortController.abort();
                dispatchExec({ type: 'COMPLETE', reason: 'char_limit' });
                return prev;
              }
              
              // Check token budget (access from execData)
              if (execData.tokenCount > execData.tokenBudget * 0.95) {
                abortController.abort();
                dispatchExec({ type: 'HIT_LIMIT' });
                return prev;
              }
              
              // Check for semantic stop
              if (detectSemanticStop(next, execData.tokenCount)) {
                abortController.abort();
                dispatchExec({ type: 'COMPLETE', reason: 'semantic_stop' });
                return prev;
              }
              
              return next;
            });
        };
        
        const options = {
            onToken,
            signal: abortController.signal
        };

        const response = await processLLM(modelId, text, options);
        
        if (response.error) {
            if (response.error === "Request aborted") {
                if (streamingContent.trim()) {
                     await appendMessageToConversation("assistant", streamingContent, {
                        avatarType: "neural",
                        model: modelId,
                    });
                }
            } else if (response.errorCategory) {
                // Unified Error Handling using Notification System
                const errorMsg = getRandomErrorMsg(response.errorCategory);
                showNotification("error", errorMsg, [
                    { label: "Try again", onClick: () => {
                        const retryReqId = nanoid();
                        setRequestId(retryReqId);
                        dispatchExec({ type: 'RETRY' });
                        dispatchExec({ type: 'START_STREAMING' });
                        handleLLMRequest(modelId, text, retryReqId);
                    }},
                    { label: "Switch model", onClick: () => setIsModelMenuOpen(true) }
                ]);
                setState("idle");
                dispatchExec({ type: 'FAIL', error: errorMsg, category: response.errorCategory });
            } else if (response.error.includes("limit_reached") || response.error.includes("limit reached") || response.error.includes("FREE_TRIAL_EXHAUSTED")) {
                 setLimitReached(true);
                 setUsageWarning("You've reached the free trial limit for +AI.");
                 showNotification("limit", "You've reached your free +AI limit", [
                     { label: "Upgrade", onClick: () => router.push("/pricing") }
                 ]);
                 setState("idle");
                 dispatchExec({ type: 'HIT_LIMIT' });
            } else {
                 // Fallback for unknown errors
                 setUsageWarning(response.error);
                 setState("idle");
                 dispatchExec({ type: 'FAIL', error: response.error });
            }
        } else if (response.text) {
             setUsageWarning(null);
             await appendMessageToConversation("assistant", response.text, {
                avatarType: "neural",
                model: modelId,
             });
             onResponse?.(response.text);
        }
    } catch (error) {
        console.error("LLM Error:", error);
        dispatchExec({ type: 'FAIL', error: String(error) });
    } finally {
        setStreamingContent("");
        setAssistantStatusText(null);
        firstTokenSeenRef.current = false;
        lastTokenAtRef.current = null;
        setRequestId(null);
        if (limitReached) {
            dispatchExec({ type: 'HIT_LIMIT' });
        } else {
            dispatchExec({ type: 'COMPLETE' });
        }
        if (!limitReached) {
            setState("idle");
        }
        setIsProcessingInput(false);
        abortControllerRef.current = null;
    }
  };

  const getRandomErrorMsg = (category: LLMErrorCategory) => {
      const messages = [
          "This model is experiencing high demand. Try again shortly or switch models.",
          "Heavy traffic is causing delays. You can retry or pick another model.",
          "The model is overloaded at the moment. Switching models may be faster."
      ];
      return messages[Math.floor(Math.random() * messages.length)];
  };


  // Process LLM response
  const processLLM = async (modelId: string, text: string, options?: any): Promise<ModelResponse> => {
    try {
      switch (modelId) {
        case "gpt-5.1":
          return await processGPT(text, options);
        case "gpt-5.1-code":
          return await processGPTCode(text, options);
        case "claude-3.5":
          return await processClaude(text, options);
        case "sonnet-4.5":
          return await processSonnet(text, options);
        case "gemini-1.5":
          return await processGemini(text, options);
        case "elevenlabs":
          return await processElevenLabs(text);
        case "suno":
          return await processSuno(text);
        case "hume":
          return await processHume(text);
        case "runway":
          return await processRunway(text);
        default:
          return await processGPT(text, options);
      }
    } catch (error) {
      console.error("Error processing LLM:", error);
      return { text: undefined, error: "Failed to process LLM" };
    }
  };

  // Activate logic separated for reuse
  const performActivation = () => {
    setIsActivated(true);
    setHasActivatedOnce(true);
    setShowGreeting(true);
    
    setTimeout(async () => {
      if (inputMode === "voice") {
        try {
          await startRecording();
          setTimeout(() => {
            if (isRecording) {
              setState("recording");
            }
          }, 100);
        } catch (error) {
          console.error("Failed to start recording:", error);
        }
      } else if (inputMode === "text") {
        textareaRef.current?.focus();
      }
    }, 600);
  };

  const handleActivate = async () => {
    if (!isActivated && state === "idle") {
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }
      performActivation();
    }
  };

  useEffect(() => {
    if (openAuthOnMount && !currentUser) {
      setShowAuthModal(true);
    }
  }, [openAuthOnMount, currentUser]);

  useEffect(() => {
    // Ensure chat/text remains the default; voice is activated via press-and-hold gesture.
    if (inputMode !== "text") {
      setInputMode("text");
    }
  }, [inputMode, setInputMode]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    performActivation();
  };

  useEffect(() => {
    if (isRecording && state !== "recording") {
      setState("recording");
    }
  }, [isRecording, state]);

  const handleTextSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const value = typeof overrideText === "string" ? overrideText : textInput;
    if (!value.trim() || isProcessingInput) return;
    if (!canSubmit) {
      enqueueSubmission({ text: value });
      if (typeof overrideText !== "string") {
        setTextInput("");
      }
      return;
    }
    if (voiceGestureState !== "idle") return;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (limitReached) return;

    setIsProcessingInput(true);
    const reqId = nanoid();
    setRequestId(reqId);
    dispatchExec({ type: 'START_VALIDATION', requestId: reqId });
    setState("processing");
    if (!hasActivatedOnce) {
      setHasActivatedOnce(true);
      setIsActivated(true);
      setShowGreeting(false);
    }
    const trimmedInput = value.trim();
    setLastPrompt(trimmedInput);
    
    // Save user message with vault refs
    await appendMessageToConversation("user", trimmedInput, { 
      avatarType: "user",
      vaultRefs: vaultRefs.length > 0 ? vaultRefs : undefined,
    });
    
    if (typeof overrideText !== "string") {
      setTextInput("");
    }

    dispatchExec({ type: 'BEGIN_ROUTING' });
    dispatchExec({ type: 'BEGIN_PREFLIGHT' });
    
    // Resolve vault context if refs exist
    let assembledPrompt = trimmedInput;
    if (vaultRefs.length > 0 && currentUser) {
      const budget = getCharBudget(userSubscription?.planId);
      const vaultContext = await resolveVaultContext(currentUser.uid, vaultRefs, budget);
      assembledPrompt = buildPromptWithVault(trimmedInput, vaultContext);
    } else {
      // Fallback to basic prompt if no vault refs
      const plusTokens = extractPlusTokens(trimmedInput);
      assembledPrompt = buildPrompt(trimmedInput, plusTokens);
    }
    
    // Clear vault refs after submission
    setVaultRefs([]);

    await handleLLMRequest(selectedModel, assembledPrompt, reqId);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    // Also stop any "typing" animation and reveal full text immediately.
    setStopPrintSignal((v) => v + 1);
  };

  const cancelVoiceGesture = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressPointerIdRef.current = null;
    pressStartRef.current = null;

    if (pressBecameRecordingRef.current || isRecording) {
      discardNextAudioRef.current = true;
      stopRecording();
    }

    pressBecameRecordingRef.current = false;
    setVoiceGestureState("idle");
    setRecordStartAt(null);
    setRecordElapsedMs(0);
  };

  const stopAndSendVoice = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    pressPointerIdRef.current = null;
    pressStartRef.current = null;

    if (pressBecameRecordingRef.current || isRecording) {
      stopRecording();
    } else {
      setVoiceGestureState("idle");
    }
  };

  const handleNeuralBoxPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // If user has typed text, treat button as a normal "Send" tap (avoid voice gesture).
    if (textInput.trim()) {
      return;
    }

    // Don't start voice gesture while processing/streaming; button acts as Stop there.
    if (state === "processing" || state === "speaking") return;
    if (voiceGestureState === "locked") return;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (limitReached) {
      router.push("/pricing");
      return;
    }

    pressPointerIdRef.current = e.pointerId;
    pressStartRef.current = { x: e.clientX, y: e.clientY };
    pressBecameRecordingRef.current = false;
    setVoiceGestureState("holding");

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(async () => {
      try {
        // If we left holding state, we were cancelled.
        if (voiceGestureState !== "holding") return;
        await startRecording();
        pressBecameRecordingRef.current = true;
        setRecordStartAt(Date.now());
        setVoiceGestureState("recording");
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          // @ts-ignore best-effort haptic
          navigator.vibrate?.(10);
        }
      } catch {
        setVoiceGestureState("idle");
      }
    }, VOICE_HOLD_DELAY_MS);
  };

  const handleNeuralBoxPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pressPointerIdRef.current !== e.pointerId) return;
    if (voiceGestureState !== "holding" && voiceGestureState !== "recording") return;
    const start = pressStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (dx <= -VOICE_CANCEL_THRESHOLD_PX) {
      setVoiceGestureState("canceling");
      cancelVoiceGesture();
    }
  };

  const handleNeuralBoxPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pressPointerIdRef.current !== e.pointerId) return;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    // If we never started recording, just reset.
    if (!pressBecameRecordingRef.current && !isRecording) {
      pressPointerIdRef.current = null;
      pressStartRef.current = null;
      setVoiceGestureState("idle");
      return;
    }

    // If locked, do nothing on release (hands-free continues).
    if (voiceGestureState === "locked") {
      pressPointerIdRef.current = null;
      pressStartRef.current = null;
      return;
    }

    // Otherwise, stop and send.
    setVoiceGestureState("sending");
    stopAndSendVoice();
  };

  const handleNeuralBoxPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (pressPointerIdRef.current !== e.pointerId) return;
    cancelVoiceGesture();
  };

  const handlePrimaryButtonClick = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (limitReached) {
        router.push("/pricing");
        return;
    }

    if (voiceGestureState === "sending" || voiceGestureState === "canceling") {
      return;
    }

    // Tap while recording locks; tap while locked stops.
    if (voiceGestureState === "recording") {
      setVoiceGestureState("locked");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        // @ts-ignore best-effort haptic
        navigator.vibrate?.(10);
      }
      return;
    }
    if (voiceGestureState === "locked") {
      setVoiceGestureState("sending");
      stopAndSendVoice();
      return;
    }

    if (state === "processing" || state === "speaking") {
        handleStop();
        return;
    }

    if (!textInput.trim() || isProcessingInput) return;
    if (!canSubmit) return;
    handleTextSubmit(undefined, textInput);
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    // Keep chat/text as the default; voice is activated via press-and-hold on the Neural Box.
    setInputMode("text");
    setIsModelMenuOpen(false);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 300);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > nextHeight ? "auto" : "hidden";
  }, [textInput]);

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // showKeyboardMock is currently unused; the previous tools menu + keyboard mock overlay was removed.

  useEffect(() => {
    if (conversationHistory.length > 0 && !hasActivatedOnce) {
      setHasActivatedOnce(true);
      if (!isActivated) {
        setIsActivated(true);
      }
      setShowGreeting(false);
    }
  }, [conversationHistory, hasActivatedOnce, isActivated, setIsActivated, setShowGreeting]);

  useEffect(() => {
    if (!canSubmit) return;
    if (isProcessingInput) return;
    const next = pendingQueue[0];
    if (!next) return;
    shiftSubmission();
    handleTextSubmit(undefined, next.text);
  }, [canSubmit, isProcessingInput, pendingQueue]);

  useEffect(() => {
    // Switching conversations: reset "seen" tracking so history doesn't animate
    seenMessageIdsRef.current = new Set();
    setHistoryHydrated(false);
    manualOverrideIdsRef.current = new Set();
    setCollapsedById({});
    setTallById({});
  }, [currentConversationId]);

  useEffect(() => {
    // First time we receive history after opening a conversation, mark everything as seen.
    if (!historyHydrated) {
      for (const msg of conversationHistory) {
        if (msg?.id) seenMessageIdsRef.current.add(msg.id);
      }
      setHistoryHydrated(true);
      return;
    }

    // After hydration, keep set updated so only truly new IDs animate.
    for (const msg of conversationHistory) {
      if (msg?.id) seenMessageIdsRef.current.add(msg.id);
    }
  }, [conversationHistory, historyHydrated]);

  const latestAssistantId = useMemo(() => {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const m = conversationHistory[i];
      if (m?.sender === "assistant") return m.id;
    }
    return null;
  }, [conversationHistory]);

  // Auto-collapse older long assistant messages unless the user manually toggled them.
  useEffect(() => {
    if (!conversationHistory.length) return;
    setCollapsedById((prev) => {
      let changed = false;
      const next: Record<string, boolean> = { ...prev };

      for (const msg of conversationHistory) {
        if (!msg?.id || msg.sender !== "assistant") continue;
        if (manualOverrideIdsRef.current.has(msg.id)) continue;

        const isLongByChars = (msg.content?.length ?? 0) > ASSISTANT_COLLAPSE_CHAR_THRESHOLD;
        const isTall = Boolean(tallById[msg.id]);
        const shouldAutoCollapse = isLongByChars || isTall;

        if (!shouldAutoCollapse) continue;

        const desired = msg.id === latestAssistantId ? false : true;
        if (next[msg.id] !== desired) {
          next[msg.id] = desired;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [conversationHistory, tallById, latestAssistantId]);

  const handleToggleCollapse = (messageId: string) => {
    manualOverrideIdsRef.current.add(messageId);
    setCollapsedById((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  };

  useEffect(() => {
    if (!scrollContainerRef.current || userHasScrolled) return;
    
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [conversationHistory, userHasScrolled, streamingContent]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setUserHasScrolled(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const canSendText = Boolean(textInput.trim());
  
  const showVoiceOverlay =
    voiceGestureState === "holding" || voiceGestureState === "recording" || voiceGestureState === "locked";
  const showStopButton =
    state === "processing" || state === "speaking" || isProcessingInput || showVoiceOverlay;
  const primaryButtonDisabled = !canSendText && !showStopButton;

  const isActive = state === "listening" || state === "recording" || state === "processing" || state === "speaking";
  const promptVisible = forcePromptVisible || isActivated;

  const formattedTimer = useMemo(() => {
    const totalSeconds = Math.floor(recordElapsedMs / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [recordElapsedMs]);

  useEffect(() => {
    if (voiceGestureState !== "recording" && voiceGestureState !== "locked") {
      setRecordElapsedMs(0);
      return;
    }
    const startAt = recordStartAt ?? Date.now();
    const id = window.setInterval(() => {
      setRecordElapsedMs(Date.now() - startAt);
    }, 200);
    return () => window.clearInterval(id);
  }, [voiceGestureState, recordStartAt]);

  return (
    <div className={`flex h-full min-h-0 flex-col relative ${className}`}>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess}
      />
      
      {limitReached && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <Lock className="h-6 w-6" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-gray-900">You’ve reached your free +AI limit</h2>
                  <p className="mb-6 text-sm text-gray-600">
                      You’ve used all your free messages. Upgrade to continue using 1,000+ AI models in one secure workspace, with higher limits and priority performance.
                  </p>
                  <div className="flex flex-col gap-3">
                      <Link 
                        href="/pricing" 
                        className="flex w-full items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:scale-[1.02]"
                      >
                          Upgrade now
                      </Link>
                      <button 
                        onClick={() => setLimitReached(false)} 
                        className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                      >
                          Not now
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div
        ref={scrollContainerRef}
        className="chat-scroll-fade flex-1 overflow-y-auto px-3 pb-44 pt-6 sm:px-6"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-3 sm:px-4">

          {conversationHistory.length > 0 &&
            conversationHistory.map((entry) => {
              const isUser = entry.sender === "user";
              const shouldAnimate =
                historyHydrated &&
                !isUser &&
                entry.sender === "assistant" &&
                !seenMessageIdsRef.current.has(entry.id);
              const modelLabel = entry.model ? (getModelById(entry.model)?.name ?? entry.model) : null;
              const isAssistant = entry.sender === "assistant";
              const isLongByChars = (entry.content?.length ?? 0) > ASSISTANT_COLLAPSE_CHAR_THRESHOLD;
              const isTall = Boolean(tallById[entry.id]);
              const isCollapsible = isAssistant && (isLongByChars || isTall);
              const isCollapsed = Boolean(collapsedById[entry.id]) && isCollapsible;
              const preview = isAssistant ? buildCollapsedPreview(entry.content) : null;
              return (
                <div
                  key={entry.id}
                  className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${!isUser ? "bg-gray-50/60" : ""} py-5 px-3`}
                >
                  <div
                    className={`flex flex-col gap-3 ${
                      isUser ? "max-w-[85%] sm:max-w-[70%]" : "w-full max-w-4xl"
                    }`}
                  >
                    <article
                      className={`${
                        isUser
                          ? "rounded-[5px] bg-gray-800 text-white px-5 py-3"
                          : "bg-transparent text-gray-900 px-2"
                      }`}
                    >
                      <div className={`space-y-3 text-[15px] leading-7 ${isUser ? "text-white" : "text-gray-900"}`}>
                        {isAssistant && isCollapsed && preview ? (
                          <div className="relative">
                            <div className="whitespace-pre-wrap text-[15px] sm:text-[16px] leading-[1.4] sm:leading-[1.45] text-gray-900">
                              {preview.head}
                              {!preview.headHasTail && preview.tail && (
                                <>
                                  {"\n…\n"}
                                  {preview.tail}
                                </>
                              )}
                            </div>
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-50 to-transparent" />
                          </div>
                        ) : (
                          <div
                            ref={(node) => {
                              // Measure height only for assistant messages that aren't already long by chars.
                              // If it exceeds the height threshold, we'll mark it as tall and auto-collapse older ones.
                              if (!node || !isAssistant || isLongByChars) return;
                              const h = node.getBoundingClientRect().height;
                              if (h > ASSISTANT_COLLAPSE_HEIGHT_THRESHOLD_PX && !tallById[entry.id]) {
                                setTallById((prev) => ({ ...prev, [entry.id]: true }));
                              }
                            }}
                          >
                            <AnimatedContent
                              text={entry.content}
                              isUser={isUser}
                              messageId={entry.id}
                              animate={shouldAnimate}
                              stopSignal={stopPrintSignal}
                            />
                          </div>
                        )}
                      </div>
                    </article>
                    {!isUser && (
                      <div className="flex flex-row flex-nowrap items-center gap-1 text-gray-400 overflow-x-auto pb-2 border-b border-gray-200">
                        <button className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-900 flex-shrink-0" aria-label="Copy">
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-900 flex-shrink-0" aria-label="Thumbs up">
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-900 flex-shrink-0" aria-label="Thumbs down">
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-900 flex-shrink-0" aria-label="Regenerate">
                          <RefreshCcw className="h-3.5 w-3.5" />
                        </button>
                        {isCollapsible && (
                          <button
                            type="button"
                            onClick={() => handleToggleCollapse(entry.id)}
                            className="ml-2 inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold tracking-wide text-gray-600 whitespace-nowrap flex-shrink-0 hover:bg-gray-50"
                            aria-label={isCollapsed ? "Show more" : "Show less"}
                          >
                            {isCollapsed ? "Show more" : "Show less"}
                          </button>
                        )}
                        {modelLabel && (
                          <span
                            className="ml-2 inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold tracking-wide text-gray-600 whitespace-nowrap flex-shrink-0"
                            title={modelLabel}
                          >
                            {modelLabel}
                          </span>
                        )}
                        <div className="flex-1" />
                        <span className="text-gray-500 whitespace-nowrap text-[11px] flex-shrink-0">
                          {new Date(entry.timestamp).toLocaleString([], {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    
                    {/* Vault Context Sources Bar - show for assistant messages with vault refs */}
                    {isAssistant && entry.vaultRefs && entry.vaultRefs.length > 0 && (
                      <div className="mt-3 px-2">
                        <ContextSourcesBar sources={entry.vaultRefs} />
                      </div>
                    )}
                  </div>
                  {!isUser && (
                    <div className="flex-shrink-0 ml-3 pt-5">
                        {renderAvatar(entry.sender as any, entry.avatarUrl)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming Bubble */}
            {streamingContent && (
                 <div className="flex w-full justify-start bg-gray-50/60 py-5 px-3">
                     <div className="flex flex-col gap-3 w-full max-w-4xl">
                        <article className="bg-transparent text-gray-900 px-2">
                             <div className="space-y-3 text-[15px] leading-7 text-gray-900">
                                {/* Streaming content is already incremental; don't re-type it */}
                                <AnimatedContent text={streamingContent} isUser={false} messageId="streaming" animate={false} stopSignal={stopPrintSignal} />
                             </div>
                        </article>
                     </div>
                     <div className="flex-shrink-0 ml-3 pt-5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-600 text-white flex-shrink-0">
                            <VIIMAnimation state={state} size="custom" customSize={24} container="none" />
                        </div>
                     </div>
                 </div>
            )}

          {assistantStatusText && (
            <div className="assistant-status">{assistantStatusText}</div>
          )}

          {!hasActivatedOnce && (
            <div className={`${!currentUser ? `fixed inset-0 flex items-center justify-center ${showAuthModal ? "z-0 pointer-events-none" : "z-[9999] pointer-events-none"}` : ""}`}>
              <button
                type="button"
                onClick={handleActivate}
                className={`group flex flex-col items-center gap-4 rounded-[32px] bg-transparent px-6 py-6 text-center transition hover:-translate-y-0.5 pointer-events-auto filter-none backdrop-filter-none ${
                  !currentUser ? "scale-110 drop-shadow-2xl" : ""
                }`}
              >
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-[24px] bg-transparent">
                  <VIIMAnimation state="idle" size="sm" container="square" visualStyle="particles" audioStream={null} />
                </div>
                <div className="space-y-1 text-gray-800">
                  <p className={`text-base font-semibold ${!currentUser ? "text-gray-900 text-lg" : ""}`}>Tap to launch +AI</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vault Autocomplete */}
      {autocomplete.isOpen && (
        <VaultAutocomplete
          items={autocomplete.items}
          selectedIndex={autocomplete.selectedIndex}
          position={autocomplete.position}
          onSelect={autocomplete.onSelect}
          onClose={autocomplete.onClose}
        />
      )}

      {/* Stall Actions Bar */}
      {execState === 'stalled' && (
        <div className="pointer-events-auto fixed bottom-[100px] left-0 right-0 z-30">
          <StallActionsBar
            onRetry={() => {
              const retryReqId = nanoid();
              setRequestId(retryReqId);
              dispatchExec({ type: 'RETRY' });
              dispatchExec({ type: 'START_STREAMING' });
              handleLLMRequest(selectedModel, lastPrompt, retryReqId);
            }}
            onCancel={() => {
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
              }
              dispatchExec({ type: 'CANCEL' });
              setState('idle');
            }}
            theme="light"
          />
        </div>
      )}

      {showInputPanel && (
        <div
          ref={inputContainerRef}
          className={`pointer-events-auto fixed bottom-0 left-0 right-0 z-20 border-t border-white/50 bg-white/90 px-3 py-3 backdrop-blur transition-all duration-300 ${
            promptVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
          } ${blurInput ? "filter blur-sm" : ""} ${disableInteractions ? "pointer-events-none select-none" : ""}`}
        >
          <div className="mx-auto w-full max-w-4xl space-y-3 px-1 sm:px-3">
            {usageWarning && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
                {usageWarning}
              </div>
            )}
            <div className="flex items-end gap-3">
              <div className="flex flex-1 flex-col items-stretch gap-3">
                <div className="relative px-2 sm:px-0 min-h-[1px]">
                  {/* Agent Menu */}
                  <div
                    className={`absolute bottom-full left-1/2 z-0 w-[95%] max-w-[360px] -translate-x-1/2 rounded-t-[5px] border border-gray-300 bg-white/95 px-3 py-3 transition-all duration-200 ${
                      isAgentMenuOpen
                        ? "translate-y-[18px] opacity-100 pointer-events-auto"
                        : "translate-y-8 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="p-2">
                      <h3 className="text-[10px] font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Select Agent</h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {["+Agent", "Code Agent", "Research Agent", "Creative Agent"].map((agent) => {
                          const isActive = agent === selectedAgent;
                          return (
                            <button
                              key={agent}
                              type="button"
                              onClick={() => {
                                setSelectedAgent(agent);
                                setIsAgentMenuOpen(false);
                              }}
                              className={`rounded-md px-2 py-1.5 text-center text-[11px] font-medium transition ${
                                isActive
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {agent}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Model Menu */}
                  <div
                    className={`absolute bottom-full left-1/2 z-0 w-[95%] max-w-[360px] -translate-x-1/2 rounded-t-[5px] border border-gray-300 bg-white/95 px-3 py-3 transition-all duration-200 ${
                      isModelMenuOpen
                        ? "translate-y-[18px] opacity-100 pointer-events-auto"
                        : "translate-y-8 opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="p-2">
                      <h3 className="text-[10px] font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Select Model</h3>
                      <div className="mb-2">
                        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5">
                          <Search className="h-3.5 w-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={modelQuery}
                            onChange={(e) => setModelQuery(e.target.value)}
                            placeholder="Search models"
                            className="w-full text-xs text-gray-900 placeholder:text-gray-500 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {filteredModels.length === 0 && (
                          <p className="col-span-2 text-[10px] text-gray-400 px-2 py-1.5 text-center">
                            No models match "{modelQuery}"
                          </p>
                        )}
                        {filteredModels.map((model) => {
                          const isActive = model.id === selectedModel;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => handleModelSelect(model.id)}
                              className={`rounded-md px-2 py-1.5 text-center text-[11px] font-medium transition ${
                                isActive
                                  ? "bg-gray-900 text-white"
                                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {model.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex flex-col rounded-[5px] border-[3px] border-gray-300 bg-white/95 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] gap-2">
                  <textarea
                    ref={textareaRef}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="What up?"
                    disabled={isProcessingInput || limitReached || voiceGestureState !== "idle"}
                    rows={1}
                    className="w-full resize-none overflow-y-hidden bg-transparent text-sm leading-6 text-gray-900 placeholder:text-gray-500 focus:outline-none [&::-webkit-scrollbar]:hidden"
                    onKeyDown={(e) => {
                      // Handle autocomplete navigation first
                      autocomplete.onKeyDown(e);
                      
                      // If autocomplete didn't handle it, check for Enter to submit
                      if (e.key === "Enter" && !e.shiftKey && voiceGestureState === "idle" && !autocomplete.isOpen) {
                        e.preventDefault();
                        handleTextSubmit();
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
                    <button
                      type="button"
                      onClick={() => setIsAgentMenuOpen((prev) => !prev)}
                      className="inline-flex max-w-[50%] items-center justify-center truncate rounded-full border border-gray-200 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-gray-500 transition hover:border-gray-400 sm:max-w-none"
                      title={selectedAgent}
                    >
                      {selectedAgent}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModelMenuOpen((prev) => !prev)}
                      className="inline-flex max-w-[50%] items-center justify-center truncate rounded-full border border-gray-200 px-2 py-1 text-[9px] uppercase tracking-[0.25em] text-gray-500 transition hover:border-gray-400 sm:max-w-none"
                      title={currentModel?.name || "Select model"}
                    >
                      {currentModel?.name || "Select model"}
                    </button>
                    <button
                      className="rounded-full p-1.5 transition hover:text-gray-900"
                      aria-label="Camera"
                      disabled
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-full p-1.5 transition hover:text-gray-900"
                      aria-label="Photo library"
                      disabled
                    >
                      <Image className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrimaryButtonClick}
                disabled={primaryButtonDisabled && Boolean(currentUser)}
                onPointerDown={handleNeuralBoxPointerDown}
                onPointerMove={handleNeuralBoxPointerMove}
                onPointerUp={handleNeuralBoxPointerUp}
                onPointerCancel={handleNeuralBoxPointerCancel}
                className={`flex flex-col items-center gap-1 rounded-3xl px-2 py-1 transition ${
                  primaryButtonDisabled && Boolean(currentUser) ? "cursor-not-allowed opacity-40" : "hover:scale-[1.02]"
                }`}
              >
                {limitReached ? (
                     <>
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600 shadow-lg">
                            <Lock className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Upgrade
                        </span>
                     </>
                ) : showStopButton ? (
                   <>
                       <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black shadow-lg">
                           <Square className="h-3 w-3 text-white fill-white" />
                       </div>
                       {showVoiceOverlay && (
                         <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                           {voiceGestureState === "locked" ? `Locked ${formattedTimer}` : formattedTimer}
                         </span>
                       )}
                       <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                           Stop
                       </span>
                       {voiceGestureState === "holding" || voiceGestureState === "recording" ? (
                         <span className="text-[9px] font-semibold tracking-wide text-gray-400 whitespace-nowrap">
                           Slide ← to cancel
                         </span>
                       ) : null}
                   </>
                ) : (
                    <>
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black shadow-lg">
                          <VIIMAnimation
                            state={state}
                            size="xxs"
                            container="square"
                            visualStyle="particles"
                            audioStream={getAudioStream()}
                          />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Send
                        </span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ActiveIndicator removed (was a red pulsing overlay shown while active) */}
    </div>
  );
}
