import { NextRequest, NextResponse } from "next/server";
import { createVaultFolder, listVaultFolders } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const folders = await listVaultFolders(userId);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("GET /api/vault/folders error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name } = body;
    if (!userId || !name) {
      return NextResponse.json({ error: "Missing userId or name" }, { status: 400 });
    }
    const folder = await createVaultFolder(userId, name);
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("POST /api/vault/folders error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

