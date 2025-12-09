import { NextRequest, NextResponse } from "next/server";
import { checkUsageAllowed, logUsage } from "@/lib/usageService";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "gpt-4o-mini", system } = await req.json();
    const userId = req.headers.get("x-user-id") || "anonymous";

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const guard = await checkUsageAllowed(userId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason ?? "Usage limit reached" }, { status: 429 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "OpenAI request failed", details: errorPayload },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";

    const promptTokens = data?.usage?.prompt_tokens ?? 0;
    const completionTokens = data?.usage?.completion_tokens ?? 0;

    await logUsage({
      userId,
      provider: "openai",
      model,
      promptTokens,
      completionTokens,
    });

    return NextResponse.json({ text, raw: data });
  } catch (error) {
    console.error("OpenAI route error:", error);
    return NextResponse.json({ error: "Unexpected error calling OpenAI" }, { status: 500 });
  }
}


