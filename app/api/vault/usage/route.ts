import { NextRequest, NextResponse } from "next/server";
import { logVaultUsage } from "@/lib/vaultUsage";
import type { VaultRef } from "@/types/conversation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, conversationId, messageId, vaultRefs, model, charCount } = body;

    if (!userId || !conversationId || !messageId || !vaultRefs || !model || typeof charCount !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await logVaultUsage({
      userId,
      conversationId,
      messageId,
      vaultRefs: vaultRefs as VaultRef[],
      model,
      charCount,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/vault/usage error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

