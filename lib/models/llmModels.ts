// LLM Model plumbing – routes to real provider APIs
// SECURITY NOTE: These functions MUST ONLY accept text payloads.
// Raw audio, images, or biometric data must NEVER be sent to these endpoints.
// All STT and OCR must happen on our infrastructure first.

import type { ModelResponse } from "./modelRegistry";

interface LLMOptions {
  onToken?: (token: string) => void;
  signal?: AbortSignal;
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
      return { error: typeof message === "string" ? message : JSON.stringify(message), status: response.status };
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
            console.log("Stream aborted");
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
    return { error: `Unable to reach ${label}` };
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
