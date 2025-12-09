import { NextRequest, NextResponse } from "next/server";
import { ensureProfile, getProfile } from "@/lib/voiceLockService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const profile = await getProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toDate().toISOString(),
      updatedAt: profile.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching VoiceLock profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const profile = await ensureProfile(userId);

    return NextResponse.json({
      ...profile,
      createdAt: profile.createdAt.toDate().toISOString(),
      updatedAt: profile.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error creating/updating VoiceLock profile:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

