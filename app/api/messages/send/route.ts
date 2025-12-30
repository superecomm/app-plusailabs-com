import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { threadId, senderId, text, recipientId } = await req.json();
    
    console.log('[Messages API] Sending message:', { threadId, senderId, textLength: text?.length });

    if (!threadId || !senderId || !text || !recipientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    // Verify sender is participant
    const threadDoc = await db.collection("messageThreads").doc(threadId).get();
    if (!threadDoc.exists) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const threadData = threadDoc.data()!;
    if (!threadData.participants.includes(senderId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if recipient blocked sender
    const recipientDoc = await db.collection("users").doc(recipientId).get();
    const recipientData = recipientDoc.data();
    if (recipientData?.blockedUsers?.includes(senderId)) {
      return NextResponse.json({ error: "Cannot send message" }, { status: 403 });
    }

    // Create message
    const messageRef = db
      .collection("messageThreads")
      .doc(threadId)
      .collection("messages")
      .doc();

    await messageRef.set({
      id: messageRef.id,
      senderId,
      text: text.trim(),
      createdAt: new Date(),
    });

    // Update thread
    await db.collection("messageThreads").doc(threadId).update({
      lastMessage: {
        text: text.trim(),
        senderId,
        timestamp: new Date(),
      },
      [`unreadCount.${recipientId}`]: FieldValue.increment(1),
      updatedAt: new Date(),
    });

    // Send push notification (async, don't wait)
    sendMessageNotification(
      recipientId,
      threadData.participantData[senderId].handle,
      text,
      threadId
    ).catch(err => console.error('Notification error:', err));

    console.log('[Messages API] Message sent:', messageRef.id);
    return NextResponse.json({ success: true, messageId: messageRef.id });
  } catch (error: any) {
    console.error("[Messages API] Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message", details: error.message },
      { status: 500 }
    );
  }
}

async function sendMessageNotification(
  recipientId: string,
  senderHandle: string,
  messageText: string,
  threadId: string
) {
  try {
    const db = getAdminFirestore();
    
    // Create in-app notification
    await db
      .collection("users")
      .doc(recipientId)
      .collection("notifications")
      .add({
        type: "message",
        title: `New message from @${senderHandle}`,
        message: messageText.slice(0, 100),
        actionUrl: `/messages/${threadId}`,
        read: false,
        createdAt: new Date(),
      });

    // TODO: Send push notification if user has subscription
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

