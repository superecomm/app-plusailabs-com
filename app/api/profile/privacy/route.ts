import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json({ 
        isPublic: false,
        publicFields: {
          showEmail: false,
          showStats: false,
          showContent: false,
        }
      });
    }

    const data = userDoc.data()!;

    return NextResponse.json({
      isPublic: data.isPublic || false,
      publicFields: data.publicFields || {
        showEmail: false,
        showStats: false,
        showContent: false,
      },
    });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch privacy settings" },
      { status: 500 }
    );
  }
}

