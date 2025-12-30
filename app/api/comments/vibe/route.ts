import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { commentId, contentId, userId, vibe } = await req.json();

    if (!commentId || !contentId || !userId || !vibe) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const commentRef = db
      .collection("contentItems")
      .doc(contentId)
      .collection("comments")
      .doc(commentId);

    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const data = commentDoc.data()!;
    const currentVibe = data.vibeHistory?.[userId];

    // Toggle logic
    if (currentVibe === vibe) {
      // Remove vibe
      await commentRef.update({
        [`vibeHistory.${userId}`]: FieldValue.delete(),
        [`vibes.${vibe === '+' ? 'plus' : 'minus'}`]: FieldValue.increment(-1),
        'vibes.score': FieldValue.increment(vibe === '+' ? -1 : 1),
      });
    } else {
      // Add or change vibe
      const updates: any = {
        [`vibeHistory.${userId}`]: vibe,
      };

      if (currentVibe) {
        // Change from + to - or vice versa
        updates[`vibes.${currentVibe === '+' ? 'plus' : 'minus'}`] = FieldValue.increment(-1);
        updates[`vibes.${vibe === '+' ? 'plus' : 'minus'}`] = FieldValue.increment(1);
        updates['vibes.score'] = FieldValue.increment(vibe === '+' ? 2 : -2);
      } else {
        // New vibe
        updates[`vibes.${vibe === '+' ? 'plus' : 'minus'}`] = FieldValue.increment(1);
        updates['vibes.score'] = FieldValue.increment(vibe === '+' ? 1 : -1);
      }

      await commentRef.update(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error vibing comment:", error);
    return NextResponse.json(
      { error: "Failed to vibe comment" },
      { status: 500 }
    );
  }
}

