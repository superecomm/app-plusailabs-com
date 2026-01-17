import { NextRequest, NextResponse } from "next/server";
import { checkUsageAllowed, logUsage } from "@/lib/usageService";

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "gemini-1.5-flash-latest", system, stream = false, imageUrl } = await req.json();
    const userId = req.headers.get("x-user-id") || "anonymous";

    if (!prompt && !imageUrl) {
      return NextResponse.json({ error: "Prompt or image is required" }, { status: 400 });
    }

    const guard = await checkUsageAllowed(userId);
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.reason ?? "Usage limit reached" }, { status: 429 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GOOGLE_GEMINI_API_KEY" }, { status: 500 });
    }

    // Build user parts
    const userParts: any[] = [{ text: prompt || "What's in this image?" }];
    if (imageUrl) {
      // Fetch image and convert to base64
      let imageBase64: string;
      if (imageUrl.startsWith('data:')) {
        imageBase64 = imageUrl.split(',')[1];
      } else {
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });
      }
      
      // Determine MIME type
      const mimeType = imageUrl.includes('png') ? 'image/png' : 
                       imageUrl.includes('gif') ? 'image/gif' : 
                       imageUrl.includes('webp') ? 'image/webp' : 'image/jpeg';
      
      userParts.push({
        inlineData: {
          mimeType,
          data: imageBase64
        }
      });
    }

    if (stream) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...(system ? [{ role: "system", parts: [{ text: system }] }] : []),
            { role: "user", parts: userParts },
          ],
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        return NextResponse.json(
          { error: "Gemini request failed", details: errorPayload },
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
          let accumulatedUsage = { promptTokenCount: 0, candidatesTokenCount: 0 };

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n").filter((line) => line.trim() !== "");

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const dataStr = line.slice(6);
                if (dataStr === "[DONE]") continue;

                try {
                  const data = JSON.parse(dataStr);
                  
                  if (data.usageMetadata) {
                     accumulatedUsage = data.usageMetadata;
                  }

                  const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textPart) {
                    controller.enqueue(encoder.encode(textPart));
                  }
                } catch (e) {
                  console.error("Error parsing Gemini stream event", e);
                }
              }
            }
          } catch (err) {
            console.error("Stream reading error", err);
            controller.error(err);
          } finally {
             if (accumulatedUsage.promptTokenCount > 0) {
                await logUsage({
                  userId,
                  provider: "google",
                  model,
                  promptTokens: accumulatedUsage.promptTokenCount,
                  completionTokens: accumulatedUsage.candidatesTokenCount,
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...(system ? [{ role: "system", parts: [{ text: system }] }] : []),
          { role: "user", parts: userParts },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Gemini request failed", details: errorPayload },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).join(" ").trim() ?? "";

    const promptTokens = data?.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = data?.usageMetadata?.candidatesTokenCount ?? 0;

    await logUsage({
      userId,
      provider: "google",
      model,
      promptTokens,
      completionTokens,
    });

    return NextResponse.json({ text, raw: data });
  } catch (error) {
    console.error("Gemini route error:", error);
    return NextResponse.json({ error: "Unexpected error calling Gemini" }, { status: 500 });
  }
}
