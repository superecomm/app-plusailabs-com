import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { saveContentItem } from "@/lib/content/contentService";
import type { ContentItem } from "@/types/content";
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
    const uid = await getAuthUserId(req);
    const { title, body, source, tags, media, product, drop, aiContext, type, visibility } = await req.json();

    const contentItem: any = {
      id: nanoid(),
      ownerId: uid,
      type: type || 'saved',
      title,
      body,
      source,
      media,
      product,
      drop,
      aiContext,
      visibility: visibility || 'private',
      tags: tags || [],
      stats: {
        views: 0,
        saves: 0,
        purchases: 0,
        revenue: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveContentItem(contentItem);
    
    return NextResponse.json({ success: true, id: contentItem.id });
  } catch (error) {
    console.error("Error saving content:", error);
    return NextResponse.json(
      { error: "Failed to save content" },
      { status: 500 }
    );
  }
}

