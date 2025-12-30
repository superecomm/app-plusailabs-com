import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    
    console.log('[Messages API] Fetching threads for user:', userId);

    // Get threads where user is a participant
    // Note: This will return empty array if collection doesn't exist yet
    const threadsSnapshot = await db
      .collection("messageThreads")
      .where("participants", "array-contains", userId)
      .limit(50)
      .get();

    const threads = threadsSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        
        // Filter out archived threads for this user
        if (data.archived && data.archived[userId]) {
          return null;
        }
        
        return {
          id: doc.id,
          ...data,
          lastMessage: {
            ...data.lastMessage,
            timestamp: data.lastMessage.timestamp?.toDate(),
          },
          lastReadAt: data.lastReadAt || {},
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      })
      .filter(Boolean);

    console.log('[Messages API] Found threads:', threads.length);
    return NextResponse.json({ threads });
  } catch (error: any) {
    console.error("[Messages API] Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId1, userId2, user1Data, user2Data } = await req.json();
    
    console.log('[Messages API] Creating thread between:', userId1, userId2);

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { error: "Missing user IDs" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Check if thread already exists
    const existingThreads = await db
      .collection("messageThreads")
      .where("participants", "array-contains", userId1)
      .get();

    for (const doc of existingThreads.docs) {
      const data = doc.data();
      if (data.participants.includes(userId2)) {
        return NextResponse.json({ threadId: doc.id });
      }
    }

    // Create new thread
    const threadRef = db.collection("messageThreads").doc();
    await threadRef.set({
      id: threadRef.id,
      participants: [userId1, userId2],
      participantData: {
        [userId1]: user1Data,
        [userId2]: user2Data,
      },
      lastMessage: {
        text: "",
        senderId: "",
        timestamp: new Date(),
      },
      lastReadAt: {
        [userId1]: new Date(),
        [userId2]: new Date(),
      },
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('[Messages API] Thread created:', threadRef.id);
    return NextResponse.json({ threadId: threadRef.id });
  } catch (error: any) {
    console.error("[Messages API] Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread", details: error.message },
      { status: 500 }
    );
  }
}

