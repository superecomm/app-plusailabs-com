import { NextRequest, NextResponse } from "next/server";
import { checkUsageAllowed, logUsage } from "@/lib/usageService";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "claude-3-5-sonnet-20240620", system } = await req.json();
    const userId = req.headers.get("x-user-id") || "anonymous";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const guard = await checkUsageAllowed(userId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason ?? "Usage limit reached" }, { status: 429 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY" }, { status: 500 });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Anthropic request failed", details: errorPayload },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text?.trim() ?? "";

    const promptTokens = data?.usage?.input_tokens ?? 0;
    const completionTokens = data?.usage?.output_tokens ?? 0;

    await logUsage({
      userId,
      provider: "anthropic",
      model,
      promptTokens,
      completionTokens,
    });

    return NextResponse.json({ text, raw: data });
  } catch (error) {
    console.error("Anthropic route error:", error);
    return NextResponse.json({ error: "Unexpected error calling Anthropic" }, { status: 500 });
  }
}


