// LLM Model plumbing – routes to real provider APIs
// SECURITY NOTE: These functions MUST ONLY accept text payloads.
// Raw audio, images, or biometric data must NEVER be sent to these endpoints.
// All STT and OCR must happen on our infrastructure first.

import type { ModelResponse } from "./modelRegistry";

async function callLLMEndpoint(
  endpoint: string,
  payload: Record<string, unknown>,
  label: string
): Promise<ModelResponse> {
  // Security Guard: Ensure no binary data in payload
  // This is a shallow check; comprehensive checks should happen at API boundary
  if (Object.values(payload).some(val => val instanceof Blob || val instanceof ArrayBuffer)) {
    console.error(`SECURITY ALERT: Attempted to send binary data to ${label}`);
    return { error: "Security Violation: Binary data blocked" };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || data?.error) {
      const message = data?.error ?? data?.details ?? `Failed to reach ${label}`;
      return { error: typeof message === "string" ? message : JSON.stringify(message), status: response.status };
    }

    return { text: data.text ?? "", status: response.status };
  } catch (error) {
    console.error(`[LLM:${label}]`, error);
    return { error: `Unable to reach ${label}` };
  }
}

export async function processGPT(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/openai",
    { prompt: text, model: "gpt-4o-mini" },
    "GPT-5.1"
  );
}

export async function processGPTCode(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/openai",
    { prompt: text, model: "o4-mini" },
    "GPT-5.1 Code"
  );
}

export async function processClaude(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/anthropic",
    { prompt: text, model: "claude-3-5-haiku-20241022" },
    "Claude 3.5"
  );
}

export async function processSonnet(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/anthropic",
    { prompt: text, model: "claude-3-5-sonnet-20240620" },
    "Sonnet 4.5"
  );
}

export async function processGemini(text: string): Promise<ModelResponse> {
  return callLLMEndpoint(
    "/api/llm/gemini",
    { prompt: text, model: "gemini-1.5-pro-latest" },
    "Gemini 1.5"
  );
}

// Only OpenAI & Anthropic routes are wired up for production.
