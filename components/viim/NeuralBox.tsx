"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import VIIMAnimation from "./VIIMAnimation";
import { useVIIMRecorder } from "./VIIMRecorder";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import type { ChatState } from "@/contexts/ChatContext";
import { GreetingBubble } from "./GreetingBubble";
import { ActiveIndicator } from "./ActiveIndicator";
import { llmModels, getModelById } from "@/lib/models/modelRegistry";
import type { ModelResponse } from "@/lib/models/modelRegistry";
import {
  Send,
  Plus,
  Camera,
  Image,
  Globe,
  BookOpen,
  PenSquare,
  ShoppingBag,
  Paperclip,
  Bot,
  Clipboard,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  MessageSquarePlus,
  MoreHorizontal,
  Search,
  Square,
} from "lucide-react";
import { processWhisper } from "@/lib/models/whisper";
import {
  processGPT,
  processGPTCode,
  processClaude,
  processSonnet,
  processGemini,
} from "@/lib/models/llmModels";
import { processElevenLabs, processSuno, processHume, processRunway } from "@/lib/models/audioModels";
import { MobileKeyboardMock } from "@/components/mobile/MobileKeyboardMock";
import ReactMarkdown from "react-markdown";

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
    setLastTranscript,
    setLastPrompt,
    conversationHistory,
    appendMessageToConversation,
  } = useChat();

  const { currentUser } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [hasActivatedOnce, setHasActivatedOnce] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [isKeyboardMockVisible, setIsKeyboardMockVisible] = useState(showKeyboardMock);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
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

  const AnimatedContent = ({
    text,
    isUser,
    messageId,
  }: {
    text: string;
    isUser: boolean;
    messageId: string;
  }) => {
    // For final messages, we don't animate if it's user, or we could.
    // Simulating typing effect for history if desired, but here we just render.
    // If it's the *currently streaming* message, we handle that in the parent render loop.
    return (
      <div className="relative">
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <p className={`whitespace-pre-line ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className={`whitespace-pre-line ${isUser ? "text-white" : "text-gray-900"}`} {...props} />
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
          {text || " "}
        </ReactMarkdown>
      </div>
    );
  };

  useEffect(() => {
    if (state !== "processing") return;
    const id = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 1600);
    return () => clearInterval(id);
  }, [state, thinkingMessages.length]);

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
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-600 text-white">
        <VIIMAnimation state={state} size="xxs" container="none" />
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
      setIsListening(false);
      setState("processing");

      if (onAudioCapture) {
        try {
          await onAudioCapture(audioBlob);
        } catch (error) {
          console.error("NeuralBox capture handler error:", error);
        }
      }

      if (variant === "capture") {
        setState("idle");
        return;
      }
      
      // Process audio by transcribing then routing to the chosen LLM
      try {
        const transcription = await processWhisper(audioBlob);

        if (transcription.text) {
          const trimmedTranscript = transcription.text.trim();
          setLastTranscript(trimmedTranscript);
          onTranscript?.(trimmedTranscript);
          if (trimmedTranscript) {
            await appendMessageToConversation("user", trimmedTranscript, { avatarType: "user" });
          }
          
          // Streaming logic not fully implemented for voice yet in this refactor step,
          // falling back to standard call but routing through processLLM wrapper.
          await handleLLMRequest(selectedModel, transcription.text);

        } else {
          setState("idle");
        }
      } catch (error) {
        console.error("Error processing audio:", error);
        setState("idle");
      }
    },
    onError: (error) => {
      console.error("Recording error:", error);
      setState("idle");
      setIsListening(false);
    },
  });

  // Unified LLM Request Handler with Streaming
  const handleLLMRequest = async (modelId: string, text: string) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setStreamingContent("");
    setState("speaking"); // Use speaking state to indicate streaming

    try {
        const onToken = (token: string) => {
            setStreamingContent((prev) => prev + token);
        };
        
        const options = {
            onToken,
            signal: abortController.signal
        };

        const response = await processLLM(modelId, text, options);
        
        if (response.error) {
            if (response.error === "Request aborted") {
                // Determine if we should save partial content
                if (streamingContent.trim()) {
                     await appendMessageToConversation("assistant", streamingContent, {
                        avatarType: "neural",
                        model: modelId,
                    });
                }
            } else {
                 setUsageWarning(response.error);
            }
        } else if (response.text) {
             setUsageWarning(null);
             // Finalize message
             await appendMessageToConversation("assistant", response.text, {
                avatarType: "neural",
                model: modelId,
             });
             onResponse?.(response.text);
        }
    } catch (error) {
        console.error("LLM Error:", error);
    } finally {
        setStreamingContent("");
        setState("idle");
        setIsProcessingInput(false);
        abortControllerRef.current = null;
    }
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
    
    // Auto-start voice recording if in voice mode, or focus text input
    setTimeout(async () => {
      if (inputMode === "voice") {
        try {
          await startRecording();
          // Set recording state after a brief delay to ensure stream is ready
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

  // Handle NeuralBox activation (tap on idle box)
  const handleActivate = async () => {
    if (!isActivated && state === "idle") {
      if (!currentUser) {
        setShowAuthModal(true);
        return;
      }
      performActivation();
    }
  };

  // Auto-open auth modal on mount when requested and unauthenticated
  useEffect(() => {
    if (openAuthOnMount && !currentUser) {
      setShowAuthModal(true);
    }
  }, [openAuthOnMount, currentUser]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // Immediately activate after login
    performActivation();
  };

  // Sync recording state with isRecording from recorder
  useEffect(() => {
    if (isRecording && state !== "recording") {
      setState("recording");
    } else if (!isRecording && state === "recording") {
      // Don't auto-change state here, let onAudioData handle it
    }
  }, [isRecording, state]);

  // Handle text input submit
  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || isProcessingInput) return;

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setIsProcessingInput(true);
    setState("processing");
    if (!hasActivatedOnce) {
      setHasActivatedOnce(true);
      setIsActivated(true);
      setShowGreeting(false);
    }
    const trimmedInput = textInput.trim();
    setLastPrompt(trimmedInput);
    await appendMessageToConversation("user", trimmedInput, { avatarType: "user" });
    setTextInput("");

    await handleLLMRequest(selectedModel, trimmedInput);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        // The handleLLMRequest catch/finally block will handle state cleanup
    }
  };

  const handlePrimaryButtonClick = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    // Stop button logic if streaming/processing
    if (state === "processing" || state === "speaking") {
        handleStop();
        return;
    }

    if (inputMode === "voice") {
      if (state === "recording") {
        stopRecording();
      } else {
        try {
          await startRecording();
          setTimeout(() => {
            setState("recording");
          }, 120);
        } catch (error) {
          console.error("Failed to start recording:", error);
        }
      }
    } else {
      if (!textInput.trim() || isProcessingInput) return;
      handleTextSubmit();
    }
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    const model = llmModels.find((m) => m.id === modelId);
    if (model?.supportsText && !model.supportsAudio) {
      setInputMode("text");
    } else if (model?.supportsAudio && !model.supportsText) {
      setInputMode("voice");
    }
    setIsModelMenuOpen(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 300);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > nextHeight ? "auto" : "hidden";
  }, [textInput]);

  // Surface internal state changes to parent components
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  useEffect(() => {
    setIsKeyboardMockVisible(showKeyboardMock || isPlusMenuOpen);
  }, [showKeyboardMock, isPlusMenuOpen]);

  useEffect(() => {
    if (conversationHistory.length > 0 && !hasActivatedOnce) {
      setHasActivatedOnce(true);
      if (!isActivated) {
        setIsActivated(true);
      }
      setShowGreeting(false);
    }
  }, [conversationHistory, hasActivatedOnce, isActivated, setIsActivated, setShowGreeting]);

  // Auto-scroll to bottom when new messages appear or during streaming
  useEffect(() => {
    if (!scrollContainerRef.current || userHasScrolled) return;
    
    const scrollToBottom = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    };

    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 50); // Slight delay for DOM update
    return () => clearTimeout(timer);
  }, [conversationHistory, userHasScrolled, streamingContent]);

  // Detect manual scroll and pause auto-scroll
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

  const isVoiceMode = inputMode === "voice";
  const canSendText = Boolean(textInput.trim());
  
  // Update button state logic
  const showStopButton = state === "processing" || state === "speaking" || isProcessingInput;
  const primaryButtonDisabled = isVoiceMode
    ? false // Voice mode handles its own states
    : !canSendText && !showStopButton;

  const isActive = state === "listening" || state === "recording" || state === "processing" || state === "speaking";
  const promptVisible = forcePromptVisible || isActivated;

  return (
    <div className={`flex h-full min-h-0 flex-col relative ${className}`}>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess}
      />
      
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 pb-44 pt-6 sm:px-6"
        style={{ scrollbarGutter: "stable" }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">

          {conversationHistory.length > 0 &&
            conversationHistory.map((entry) => {
              const isUser = entry.sender === "user";
              const speakerLabel = isUser
                ? "You"
                : getModelById(entry.model || selectedModel)?.name || "Super Plus AI";

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
                          ? "rounded-3xl bg-gray-800 text-white px-5 py-3"
                          : "bg-transparent text-gray-900 px-2"
                      }`}
                    >
                      <div className={`space-y-3 text-[15px] leading-7 ${isUser ? "text-white" : "text-gray-900"}`}>
                        <AnimatedContent text={entry.content} isUser={isUser} messageId={entry.id} />
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
                        <div className="flex-1" />
                        <span className="text-gray-500 whitespace-nowrap text-[11px] flex-shrink-0">
                          {new Date(entry.timestamp).toLocaleString([], {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {entry.model && (
                          <span className="px-2 py-0.5 text-gray-600 text-[11px] whitespace-nowrap flex-shrink-0">
                            {entry.model}
                          </span>
                        )}
                        {entry.tokenCount !== undefined && (
                          <span className="px-2 py-0.5 text-gray-600 text-[11px] whitespace-nowrap flex-shrink-0">
                            {entry.tokenCount} tokens
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Streaming Bubble */}
            {streamingContent && (
                 <div className="flex w-full justify-start bg-gray-50/60 py-5 px-3">
                     <div className="flex flex-col gap-3 w-full max-w-4xl">
                        <article className="bg-transparent text-gray-900 px-2">
                             <div className="space-y-3 text-[15px] leading-7 text-gray-900">
                                <AnimatedContent text={streamingContent} isUser={false} messageId="streaming" />
                             </div>
                        </article>
                     </div>
                 </div>
            )}

          {state === "processing" && !streamingContent && (
            <article className="flex items-center gap-3 rounded-[24px] border border-gray-100 bg-gray-50/90 px-4 py-3 text-sm text-gray-600 shadow-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                <VIIMAnimation state="processing" size="xxs" />
              </div>
              {thinkingMessages[thinkingIndex]}
            </article>
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

          {/* Empty state removed to allow user prompt as the first bubble */}
        </div>
      </div>

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

                <div className="relative z-10 flex flex-1 flex-col rounded-[5px] border border-gray-300 bg-white/95 px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] gap-2">
                  <textarea
                    ref={textareaRef}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={isVoiceMode ? "Voice mode active" : "What up?"}
                    disabled={isVoiceMode || isProcessingInput}
                    rows={1}
                    className="w-full flex-1 resize-none overflow-y-hidden bg-transparent text-sm leading-6 text-gray-900 placeholder:text-gray-500 focus:outline-none [&::-webkit-scrollbar]:hidden"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isVoiceMode) {
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
                      aria-label="Open tools"
                      onClick={() => setIsPlusMenuOpen((prev) => !prev)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-full p-1.5 transition hover:text-gray-900"
                      aria-label="Camera"
                      onClick={() => setIsPlusMenuOpen(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-full p-1.5 transition hover:text-gray-900"
                      aria-label="Photo library"
                      onClick={() => setIsPlusMenuOpen(true)}
                    >
                      <Image className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePrimaryButtonClick}
                disabled={primaryButtonDisabled && Boolean(currentUser)}
                className={`flex flex-col items-center gap-1 rounded-3xl px-2 py-1 transition ${
                  primaryButtonDisabled && Boolean(currentUser) ? "cursor-not-allowed opacity-40" : "hover:scale-[1.02]"
                }`}
              >
                {showStopButton ? (
                   <>
                       <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-black shadow-lg">
                           <Square className="h-3 w-3 text-white fill-white" />
                       </div>
                       <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                           Stop
                       </span>
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
                          {isVoiceMode ? (state === "recording" ? "Stop" : "Speak") : "Send"}
                        </span>
                    </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPlusMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 backdrop-blur-[1px]" onClick={() => setIsPlusMenuOpen(false)} />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ${
          isPlusMenuOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="rounded-t-[28px] border border-gray-100 bg-white p-5 shadow-2xl">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { icon: Camera, label: "Camera" },
              { icon: Image, label: "Photos" },
              { icon: PenSquare, label: "Create image" },
              { icon: BookOpen, label: "Summarize" },
              { icon: Globe, label: "Research" },
              { icon: Bot, label: "Agents" },
              { icon: Paperclip, label: "Attach" },
              { icon: ShoppingBag, label: "Shop" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-4 text-xs font-semibold text-gray-700 transition hover:border-gray-200"
                >
                  <Icon className="h-5 w-5 text-gray-900" />
                  {action.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            <span>Input mode</span>
            <div className="inline-flex rounded-full bg-white p-1 text-xs font-semibold text-gray-500">
              <button
                onClick={() => setInputMode("text")}
                className={`px-3 py-1 rounded-full transition ${
                  !isVoiceMode ? "bg-black text-white shadow" : "text-gray-500"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setInputMode("voice")}
                className={`px-3 py-1 rounded-full transition ${
                  isVoiceMode ? "bg-black text-white shadow" : "text-gray-500"
                }`}
              >
                Voice
              </button>
            </div>
          </div>
          {isKeyboardMockVisible && (
            <div className="mt-5">
              <MobileKeyboardMock />
            </div>
          )}
        </div>
      </div>

      <ActiveIndicator active={isActive} />
    </div>
  );
}
