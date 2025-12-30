import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    
    // Get all vault files for the user
    const filesSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("vaultFiles")
      .get();

    // Sum up file sizes
    let totalBytes = 0;
    filesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalBytes += data.size || 0;
    });

    // Calculate quota (5 GB for now, could be tier-based later)
    const quotaBytes = 5 * 1024 * 1024 * 1024; // 5 GB
    const usedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
    const quotaGB = (quotaBytes / (1024 * 1024 * 1024)).toFixed(1);
    const percentUsed = ((totalBytes / quotaBytes) * 100).toFixed(1);

    return NextResponse.json({
      totalBytes,
      quotaBytes,
      usedGB,
      quotaGB,
      percentUsed,
    });
  } catch (error) {
    console.error("Error fetching storage:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage" },
      { status: 500 }
    );
  }
}

