import { NextRequest, NextResponse } from "next/server";
import { getActiveDataset, setActiveDataset } from "@/lib/voiceLockService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const dataset = await getActiveDataset(userId);

    if (!dataset) {
      return NextResponse.json(
        { error: "No active dataset found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...dataset,
      createdAt: dataset.createdAt.toDate().toISOString(),
      updatedAt: dataset.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching active dataset:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, datasetId } = body;

    if (!userId || !datasetId) {
      return NextResponse.json({ error: "Missing userId or datasetId" }, { status: 400 });
    }

    await setActiveDataset(userId, datasetId);
    const dataset = await getActiveDataset(userId);

    return NextResponse.json({
      ...dataset,
      createdAt: dataset?.createdAt.toDate().toISOString(),
      updatedAt: dataset?.updatedAt.toDate().toISOString(),
    });
  } catch (error) {
    console.error("Error setting active dataset:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

