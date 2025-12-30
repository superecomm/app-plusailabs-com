import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, notificationId } = await req.json();

    if (!userId || !notificationId) {
      return NextResponse.json(
        { error: "Missing userId or notificationId" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Mark notification as read
    await db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .doc(notificationId)
      .update({
        read: true,
        readAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark as read" },
      { status: 500 }
    );
  }
}

