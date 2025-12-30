import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: "Missing userId or subscription" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Save push subscription to user's profile
    await db.collection("users").doc(userId).set(
      {
        pushSubscription: subscription,
        notificationsEnabled: true,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

