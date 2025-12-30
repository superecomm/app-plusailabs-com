import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    
    // Get notifications for user
    const notificationsSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: data.createdAt?.toDate(),
        read: data.read || false,
        actionUrl: data.actionUrl,
      };
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

