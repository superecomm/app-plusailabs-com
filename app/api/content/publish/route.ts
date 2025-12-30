import { NextRequest, NextResponse } from "next/server";
import { updateContentItem } from "@/lib/content/contentService";
import { getAuth } from "firebase-admin/auth";

async function getAuthUserId(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  
  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await getAuth().verifyIdToken(idToken);
  return decodedToken.uid;
}

export async function POST(req: NextRequest) {
  try {
    await getAuthUserId(req);
    const { contentId } = await req.json();

    await updateContentItem(contentId, {
      visibility: 'public',
      type: 'post',
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error publishing content:", error);
    return NextResponse.json(
      { error: "Failed to publish content" },
      { status: 500 }
    );
  }
}

