import { NextRequest, NextResponse } from "next/server";
import { checkUsageAllowed, logUsage } from "@/lib/usageService";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "gpt-4o-mini", system, stream = false } = await req.json();
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

    if (stream) {
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
          stream: true,
          stream_options: { include_usage: true },
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: "OpenAI request failed", details: errorPayload },
          { status: response.status }
        );
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const readable = new ReadableStream({
        async start(controller) {
          if (!response.body) {
            controller.close();
            return;
          }
          const reader = response.body.getReader();
          let accumulatedUsage = { prompt_tokens: 0, completion_tokens: 0 };

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n").filter((line) => line.trim() !== "");

              for (const line of lines) {
                if (line === "data: [DONE]") continue;
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.usage) {
                      accumulatedUsage = data.usage;
                    }

                    if (data.choices?.[0]?.delta?.content) {
                      controller.enqueue(encoder.encode(data.choices[0].delta.content));
                    }
                  } catch (e) {
                    console.error("Error parsing stream chunk", e);
                  }
                }
              }
            }
          } catch (err) {
            console.error("Stream reading error", err);
            controller.error(err);
          } finally {
             // Log usage after stream ends
             if (accumulatedUsage.prompt_tokens > 0) {
                await logUsage({
                  userId,
                  provider: "openai",
                  model,
                  promptTokens: accumulatedUsage.prompt_tokens,
                  completionTokens: accumulatedUsage.completion_tokens,
                }).catch(console.error);
             }
            controller.close();
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      });
    }

    // Non-streaming fallback
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
