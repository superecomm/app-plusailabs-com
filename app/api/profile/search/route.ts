import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const searchTerm = query.toLowerCase().trim();

    // Search by handle or display name
    // Note: For better search, consider using Algolia or similar
    const profilesSnapshot = await db
      .collection("users")
      .where("isPublic", "==", true)
      .limit(10)
      .get();

    // Filter results client-side (Firestore doesn't support OR/LIKE queries well)
    const profiles = profilesSnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          displayName: data.displayName,
          handle: data.handle,
          photoURL: data.photoURL,
          bio: data.bio,
          stats: data.stats,
        };
      })
      .filter((profile) => {
        const handleMatch = profile.handle?.toLowerCase().includes(searchTerm);
        const nameMatch = profile.displayName?.toLowerCase().includes(searchTerm);
        const bioMatch = profile.bio?.toLowerCase().includes(searchTerm);
        return handleMatch || nameMatch || bioMatch;
      })
      .slice(0, 5); // Limit to 5 results

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("Error searching profiles:", error);
    return NextResponse.json(
      { error: "Failed to search profiles" },
      { status: 500 }
    );
  }
}

