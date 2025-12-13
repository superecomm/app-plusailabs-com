import { NextRequest, NextResponse } from "next/server";
import { getVaultBio, saveVaultBio } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const { content, updatedAt } = await getVaultBio(userId);
    if (!content) {
      return NextResponse.json({ content: "", updatedAt: null });
    }
    return NextResponse.json({
      content,
      updatedAt: updatedAt ? updatedAt.toISOString() : null,
    });
  } catch (error) {
    console.error("GET /api/vault/bio error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content } = body;
    if (!userId || typeof content !== "string") {
      return NextResponse.json({ error: "Missing userId or content" }, { status: 400 });
    }
    const result = await saveVaultBio(userId, content);
    return NextResponse.json({
      content: result.content,
      updatedAt: result.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("POST /api/vault/bio error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

