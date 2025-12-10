import { NextRequest, NextResponse } from "next/server";
import { checkUsageAllowed, logUsage } from "@/lib/usageService";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "claude-3-5-sonnet-20240620", system, stream = false } = await req.json();
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

    if (stream) {
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
                messages: [{ role: "user", content: prompt }],
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Anthropic request failed", details: errorPayload },
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
                let accumulatedUsage = { input_tokens: 0, output_tokens: 0 };

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split("\n").filter(line => line.trim() !== "");

                        for (const line of lines) {
                            if (!line.startsWith("data: ")) continue;
                            const dataStr = line.slice(6);
                            if (dataStr === "[DONE]") continue;

                            try {
                                const event = JSON.parse(dataStr);
                                
                                if (event.type === "message_start") {
                                    if (event.message?.usage) {
                                        accumulatedUsage.input_tokens += event.message.usage.input_tokens || 0;
                                    }
                                } else if (event.type === "content_block_delta") {
                                    if (event.delta?.type === "text_delta") {
                                        controller.enqueue(encoder.encode(event.delta.text));
                                    }
                                } else if (event.type === "message_delta") {
                                    if (event.usage) {
                                        accumulatedUsage.output_tokens += event.usage.output_tokens || 0;
                                    }
                                }
                            } catch (e) {
                                console.error("Error parsing Anthropic stream event", e);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Stream reading error", err);
                    controller.error(err);
                } finally {
                    if (accumulatedUsage.input_tokens > 0) {
                        await logUsage({
                            userId,
                            provider: "anthropic",
                            model,
                            promptTokens: accumulatedUsage.input_tokens,
                            completionTokens: accumulatedUsage.output_tokens,
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
