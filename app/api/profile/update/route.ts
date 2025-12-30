import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function PATCH(req: NextRequest) {
  try {
    const { userId, displayName, bio, coverPhotoURL } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userProfileRef = db.collection("users").doc(userId);

    // Build update object with only provided fields
    const updates: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (coverPhotoURL !== undefined) updates.coverPhotoURL = coverPhotoURL;

    // Update or create profile
    await userProfileRef.set(updates, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

