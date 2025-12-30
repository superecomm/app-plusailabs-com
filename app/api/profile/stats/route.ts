import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    // Count conversations
    const conversationsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("conversations")
      .count()
      .get();
    const conversations = conversationsSnapshot.data().count || 0;

    // Count saved content items
    const savedSnapshot = await db
      .collection("contentItems")
      .where("ownerId", "==", userId)
      .where("type", "==", "saved")
      .count()
      .get();
    const saved = savedSnapshot.data().count || 0;

    // Count verifications (if applicable)
    const verificationsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("verifications")
      .count()
      .get();
    const verifications = verificationsSnapshot.data().count || 0;

    return NextResponse.json({
      conversations,
      saved,
      verifications,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
