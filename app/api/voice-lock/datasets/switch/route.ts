import { NextRequest, NextResponse } from "next/server";
import { getActiveDataset, setActiveDataset } from "@/lib/voiceLockService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, datasetId } = body;

    if (!userId || !datasetId) {
      return NextResponse.json(
        { error: "Missing userId or datasetId" },
        { status: 400 }
      );
    }

    await setActiveDataset(userId, datasetId);
    const dataset = await getActiveDataset(userId);

    if (!dataset) {
      return NextResponse.json(
        { error: "Dataset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...dataset,
      createdAt: dataset.createdAt.toDate().toISOString(),
      updatedAt: dataset.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error switching dataset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

