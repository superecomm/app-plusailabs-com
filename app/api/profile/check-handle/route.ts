import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!handle || !userId) {
    return NextResponse.json(
      { error: "Missing handle or userId" },
      { status: 400 }
    );
  }

  try {
    const db = getAdminFirestore();

    // Check if handle exists (excluding current user)
    const usersSnapshot = await db
      .collection("users")
      .where("handle", "==", handle.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      // Handle is available
      return NextResponse.json({ available: true });
    }

    // Check if it's the current user's own handle
    const existingDoc = usersSnapshot.docs[0];
    if (existingDoc.id === userId) {
      return NextResponse.json({ available: true });
    }

    // Handle is taken by someone else
    return NextResponse.json({ available: false });
  } catch (error) {
    console.error("Error checking handle:", error);
    return NextResponse.json(
      { error: "Failed to check handle" },
      { status: 500 }
    );
  }
}

