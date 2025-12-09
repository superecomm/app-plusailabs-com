import { NextRequest, NextResponse } from "next/server";
import { checkUsageAllowed, logUsage } from "@/lib/usageService";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = req.headers.get("x-user-id") || "anonymous";

    if (!file) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const guard = await checkUsageAllowed(userId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason ?? "Usage limit reached" }, { status: 429 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    // OpenAI Whisper API requires a file object
    const openaiFormData = new FormData();
    openaiFormData.append("file", file);
    openaiFormData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "OpenAI transcription request failed", details: errorPayload },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data?.text?.trim() ?? "";

    // Log usage (Whisper is priced by minute, but we'll just log it as a 'whisper' call for now)
    // You might want to calculate duration if needed for precise billing
    await logUsage({
      userId,
      provider: "openai",
      model: "whisper-1",
      promptTokens: 0,
      completionTokens: 0, 
    });

    return NextResponse.json({ 
      text, 
      acousticFeatures: {
        confidence: 0.99, // OpenAI doesn't return confidence by default in simple mode
        language: "en",   // Default to 'en' or parse from verbose_json if needed
        duration: 0       // Need to parse metadata to get duration if critical
      }
    });
  } catch (error) {
    console.error("Transcription route error:", error);
    return NextResponse.json({ error: "Unexpected error during transcription" }, { status: 500 });
  }
}

