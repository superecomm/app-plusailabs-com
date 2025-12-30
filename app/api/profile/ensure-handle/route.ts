import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

/**
 * Ensure user has a handle
 * Called when user first accesses profile or during migration
 */
export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;

    // If handle already exists, return it
    if (userData.handle) {
      return NextResponse.json({ handle: userData.handle });
    }

    // Generate handle from email
    const email = userData.email || "";
    let baseHandle = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    // Ensure uniqueness
    let handle = baseHandle;
    let counter = 1;
    
    while (true) {
      const existingSnapshot = await db
        .collection("users")
        .where("handle", "==", handle)
        .limit(1)
        .get();
      
      if (existingSnapshot.empty) {
        break; // Handle is unique
      }
      
      handle = `${baseHandle}${counter}`;
      counter++;
    }

    // Save handle
    await userRef.update({ handle });

    return NextResponse.json({ handle });
  } catch (error) {
    console.error("Error ensuring handle:", error);
    return NextResponse.json(
      { error: "Failed to ensure handle" },
      { status: 500 }
    );
  }
}

