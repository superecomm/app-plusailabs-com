import { NextRequest, NextResponse } from "next/server";
import { saveSessionSample } from "@/lib/voiceLockService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const audioFile = formData.get("audio") as File | null;
    const vocalType = (formData.get("vocalType") as string) || "speech";
    const source = (formData.get("source") as string) || "mobile";

    if (!userId || !audioFile) {
      return NextResponse.json({ error: "Missing userId or audio blob" }, { status: 400 });
    }

    const { profile, dataset } = await saveSessionSample({
      userId,
      audio: audioFile,
      vocalType,
      source,
    });

    return NextResponse.json({
      profile: {
        ...profile,
        createdAt: profile.createdAt.toDate().toISOString(),
        updatedAt: profile.updatedAt.toDate().toISOString(),
      },
      dataset: {
        ...dataset,
        createdAt: dataset.createdAt.toDate().toISOString(),
        updatedAt: dataset.updatedAt.toDate().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error creating voice lock session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

