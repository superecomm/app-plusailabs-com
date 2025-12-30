import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const db = getAdminFirestore();

    // Remove push subscription
    await db.collection("users").doc(userId).update({
      pushSubscription: null,
      notificationsEnabled: false,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}

