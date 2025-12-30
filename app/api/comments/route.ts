import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const contentId = req.nextUrl.searchParams.get("contentId");

  if (!contentId) {
    return NextResponse.json({ error: "Missing contentId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    
    const snapshot = await db
      .collection("contentItems")
      .doc(contentId)
      .collection("comments")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        editedAt: data.editedAt?.toDate(),
      };
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { contentId, userId, userHandle, userDisplayName, userPhoto, text, vibe } = await req.json();

    if (!contentId || !userId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const commentId = nanoid();

    await db
      .collection("contentItems")
      .doc(contentId)
      .collection("comments")
      .doc(commentId)
      .set({
        id: commentId,
        contentId,
        userId,
        userHandle,
        userDisplayName,
        userPhoto,
        text: text.trim(),
        vibe,
        vibes: {
          plus: 0,
          minus: 0,
          score: 0,
        },
        vibeHistory: {},
        createdAt: new Date(),
      });

    // Update content comment count
    await db.collection("contentItems").doc(contentId).update({
      'stats.comments': (await db.collection("contentItems").doc(contentId).collection("comments").count().get()).data().count,
    });

    return NextResponse.json({ success: true, commentId });
  } catch (error) {
    console.error("Error posting comment:", error);
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

