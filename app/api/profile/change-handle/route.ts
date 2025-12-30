import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { userId, newHandle } = await req.json();

    if (!userId || !newHandle) {
      return NextResponse.json(
        { error: "Missing userId or newHandle" },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const oldHandle = userData.handle;

    // Check rate limiting (30 days)
    const handleChangeHistory = userData.handleChangeHistory || [];
    const lastChange = handleChangeHistory.length > 0 
      ? handleChangeHistory[handleChangeHistory.length - 1]
      : null;

    if (lastChange) {
      const lastChangeDate = lastChange.changedAt.toDate();
      const daysSince = Math.floor((Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince < 30) {
        const daysRemaining = 30 - daysSince;
        return NextResponse.json(
          { 
            error: `You can change your handle again in ${daysRemaining} days`,
            daysRemaining 
          },
          { status: 429 }
        );
      }
    }

    // Validate handle format
    const handleRegex = /^[a-z0-9_-]{3,30}$/;
    if (!handleRegex.test(newHandle.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid handle format. Use 3-30 characters (letters, numbers, _, -)"},
        { status: 400 }
      );
    }

    // Check if handle is available
    const existingHandle = await db
      .collection("users")
      .where("handle", "==", newHandle.toLowerCase())
      .limit(1)
      .get();

    if (!existingHandle.empty && existingHandle.docs[0].id !== userId) {
      return NextResponse.json(
        { error: "Handle already taken" },
        { status: 409 }
      );
    }

    // Update handle and track change
    await userRef.update({
      handle: newHandle.toLowerCase(),
      handleChangeHistory: FieldValue.arrayUnion({
        oldHandle,
        newHandle: newHandle.toLowerCase(),
        changedAt: new Date(),
      }),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, handle: newHandle.toLowerCase() });
  } catch (error) {
    console.error("Error changing handle:", error);
    return NextResponse.json(
      { error: "Failed to change handle" },
      { status: 500 }
    );
  }
}

