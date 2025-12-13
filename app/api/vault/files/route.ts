import { NextRequest, NextResponse } from "next/server";
import { createVaultFile, listVaultFiles } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const folderId = request.nextUrl.searchParams.get("folderId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const files = await listVaultFiles(userId, folderId);
    return NextResponse.json({ files });
  } catch (error) {
    console.error("GET /api/vault/files error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, folderId, downloadUrl, size, contentType } = body;
    if (!userId || !name || !downloadUrl || typeof size !== "number" || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const file = await createVaultFile(userId, { name, folderId: folderId ?? null, downloadUrl, size, contentType });
    return NextResponse.json({ file });
  } catch (error) {
    console.error("POST /api/vault/files error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

