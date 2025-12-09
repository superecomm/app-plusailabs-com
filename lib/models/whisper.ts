// Whisper API Service
// SECURITY NOTE: This service routes to our internal STT infrastructure (API Route).
// Audio data stays within our VPC/App boundary (forwarded from Next.js API to OpenAI).

import type { ModelResponse } from "./modelRegistry";

export async function processWhisper(audio: Blob): Promise<ModelResponse> {
  try {
    const formData = new FormData();
    formData.append("file", audio, "recording.webm");

    const response = await fetch("/api/llm/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Transcription failed:", errorData);
      return { 
        error: errorData.error || "Transcription failed",
        text: ""
      };
    }

    const data = await response.json();
    
    return {
      text: data.text,
      acousticFeatures: data.acousticFeatures
    };
  } catch (error) {
    console.error("Error calling transcription service:", error);
    return { 
      error: "Network error during transcription",
      text: ""
    };
  }
}
