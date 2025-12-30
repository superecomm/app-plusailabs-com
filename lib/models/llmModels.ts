// LLM Model plumbing – routes to real provider APIs
// SECURITY NOTE: These functions MUST ONLY accept text payloads.
// Raw audio, images, or biometric data must NEVER be sent to these endpoints.
// All STT and OCR must happen on our infrastructure first.

import type { ModelResponse } from "./modelRegistry";

interface LLMOptions {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export type LLMErrorCategory = 
  | "MODEL_UNAVAILABLE" 
  | "MODEL_OVERLOADED" 
  | "MODEL_TIMEOUT" 
  | "RATE_LIMITED" 
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export interface ErrorBannerConfig {
  message: string;
  shouldQueue: boolean;
  retryDelay?: number;
}

function classifyError(status: number, message: string): LLMErrorCategory {
  if (status === 429) return "RATE_LIMITED";
  if (status === 503) return "MODEL_OVERLOADED";
  if (status === 504 || message.toLowerCase().includes("timeout")) return "MODEL_TIMEOUT";
  if (status >= 500) return "MODEL_UNAVAILABLE";
  if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch")) return "NETWORK_ERROR";
  return "UNKNOWN_ERROR";
}

/**
 * Get user-friendly error message for a given error category
 */
export function getUserFriendlyErrorMessage(category: LLMErrorCategory, provider?: string): string {
  const providerName = provider || "Provider";
  
  switch (category) {
    case "MODEL_OVERLOADED":
      return `High traffic on ${providerName}. Try again in a few minutes.`;
    
    case "RATE_LIMITED":
      return "Rate limit hit. Retry in 30s or switch models.";
    
    case "MODEL_TIMEOUT":
      return "Request timed out. This model may be slow right now.";
    
    case "MODEL_UNAVAILABLE":
      return "This model is temporarily unavailable.";
    
    case "NETWORK_ERROR":
      return "Connection issue. Check your network.";
    
    case "UNKNOWN_ERROR":
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * Get configuration for how to handle different error types
 */
export function getErrorBannerConfig(category: LLMErrorCategory): ErrorBannerConfig {
  switch (category) {
    case "NETWORK_ERROR":
      return {
        message: getUserFriendlyErrorMessage(category),
        shouldQueue: true, // Queue messages on network errors
        retryDelay: 0,
      };
    
    case "RATE_LIMITED":
      return {
        message: getUserFriendlyErrorMessage(category),
        shouldQueue: false,
        retryDelay: 30000, // 30 seconds
      };
    
    case "MODEL_OVERLOADED":
      return {
        message: getUserFriendlyErrorMessage(category),
        shouldQueue: false,
        retryDelay: 60000, // 60 seconds
      };
    
    case "MODEL_TIMEOUT":
      return {
        message: getUserFriendlyErrorMessage(category),
        shouldQueue: false,
        retryDelay: 10000, // 10 seconds
      };
    
    case "MODEL_UNAVAILABLE":
      return {
        message: getUserFriendlyErrorMessage(category),
        shouldQueue: false,
        retryDelay: 120000, // 2 minutes
      };
    
    case "UNKNOWN_ERROR":
    default:
      return {
        message: getUserFriendlyErrorMessage(category),
        shouldQueue: false,
        retryDelay: 5000, // 5 seconds
      };
  }
}

async function callLLMEndpoint(
  endpoint: string,
  payload: Record<string, unknown>,
  label: string,
  options?: LLMOptions
): Promise<ModelResponse> {
  // Security Guard: Ensure no binary data in payload
  // This is a shallow check; comprehensive checks should happen at API boundary
  if (Object.values(payload).some(val => val instanceof Blob || val instanceof ArrayBuffer)) {
    console.error(`SECURITY ALERT: Attempted to send binary data to ${label}`);
    return { error: "Security Violation: Binary data blocked" };
  }

  try {
    const isStreaming = !!options?.onToken;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, stream: isStreaming }),
      signal: options?.signal,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message = data?.error ?? data?.details ?? `Failed to reach ${label}`;
      
      // Classify error for frontend
      const errorCategory = classifyError(response.status, typeof message === 'string' ? message : JSON.stringify(message));
      
      return { 
        error: typeof message === "string" ? message : JSON.stringify(message), 
        status: response.status,
        errorCategory
      };
    }

    if (isStreaming && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          options?.onToken?.(chunk);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
            return { text: fullText, status: 200 }; // Return partial text on abort
        }
        throw err;
      }
      
      return { text: fullText, status: 200 };
    }

    const data = await response.json();
    return { text: data.text ?? "", status: response.status };
  } catch (error: any) {
    if (error.name === 'AbortError') {
        return { error: "Request aborted" };
    }
    console.error(`[LLM:${label}]`, error);
    return { error: `Unable to reach ${label}`, errorCategory: "NETWORK_ERROR" };
  }
}

export async function processGPT(text: string, options?: LLMOptions): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/openai",
    { prompt: text, model: "gpt-4o-mini" },
    "GPT-5.1",
    options
  );
}

export async function processGPTCode(text: string, options?: LLMOptions): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/openai",
    { prompt: text, model: "o4-mini" },
    "GPT-5.1 Code",
    options
  );
}

export async function processClaude(text: string, options?: LLMOptions): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/anthropic",
    { prompt: text, model: "claude-3-5-haiku-20241022" },
    "Claude 3.5",
    options
  );
}

export async function processSonnet(text: string, options?: LLMOptions): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/anthropic",
    { prompt: text, model: "claude-3-5-sonnet-20240620" },
    "Sonnet 4.5",
    options
  );
}

export async function processGemini(text: string, options?: LLMOptions): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/gemini",
    { prompt: text, model: "gemini-1.5-pro-latest" },
    "Gemini 1.5",
    options
  );
}

// Only OpenAI & Anthropic routes are wired up for production.
