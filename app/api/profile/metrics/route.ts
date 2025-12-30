import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    // Get all public content by user
    const contentSnapshot = await db
      .collection("contentItems")
      .where("ownerId", "==", userId)
      .where("visibility", "==", "public")
      .get();

    let totalVibes = 0;
    let totalSaves = 0;
    let totalViews = 0;
    const posts = contentSnapshot.size;

    contentSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalVibes += data.stats?.vibes?.score || 0;
      totalSaves += data.stats?.saves || 0;
      totalViews += data.stats?.views || 0;
    });

    return NextResponse.json({
      vibes: Math.max(0, totalVibes), // Only show positive net vibes
      posts,
      saves: totalSaves,
      views: totalViews,
    });
  } catch (error) {
    console.error("Error fetching profile metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}

