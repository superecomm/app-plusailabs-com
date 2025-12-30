import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;

  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    // Find user by handle
    const usersSnapshot = await db
      .collection("users")
      .where("handle", "==", handle)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    // Check if profile is public
    if (!userData.isPublic) {
      return NextResponse.json({ error: "Profile is private" }, { status: 403 });
    }

    // Build public profile (only include public fields)
    const profile = {
      displayName: userData.displayName,
      handle: userData.handle,
      photoURL: userData.photoURL,
      coverPhotoURL: userData.coverPhotoURL,
      bio: userData.bio,
      publicFields: userData.publicFields || {
        showEmail: false,
        showStats: false,
        showContent: false,
      },
      stats: userData.publicFields?.showStats ? userData.stats : undefined,
    };

    // Get public content if enabled
    let content: any[] = [];
    if (userData.publicFields?.showContent) {
      const contentSnapshot = await db
        .collection("contentItems")
        .where("ownerId", "==", userDoc.id)
        .where("visibility", "==", "public")
        .where("type", "==", "post")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      content = contentSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          body: data.body,
          tags: data.tags,
          createdAt: data.createdAt?.toDate(),
        };
      });
    }

    return NextResponse.json({ profile, content });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

