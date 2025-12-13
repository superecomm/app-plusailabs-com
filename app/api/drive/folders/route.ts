import { NextRequest, NextResponse } from "next/server";
import { createDriveFolder, listDriveFolders } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const folders = await listDriveFolders(userId);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("GET /api/drive/folders error", error);
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
    const folder = await createDriveFolder(userId, name);
    return NextResponse.json({ folder });
  } catch (error) {
    console.error("POST /api/drive/folders error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

