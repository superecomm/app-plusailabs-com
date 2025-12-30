import { NextRequest, NextResponse } from "next/server";
import { updateContentItem, deleteContentItem } from "@/lib/content/contentService";
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthUserId(req);
    const updates = await req.json();
    const { id } = await params;
    
    await updateContentItem(id, updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getAuthUserId(req);
    const { id } = await params;
    
    await deleteContentItem(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "Failed to delete content" },
      { status: 500 }
    );
  }
}

