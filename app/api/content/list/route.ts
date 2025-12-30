import { NextRequest, NextResponse } from "next/server";
import { listContentItems } from "@/lib/content/contentService";
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

export async function GET(req: NextRequest) {
  try {
    const uid = await getAuthUserId(req);
    const filter = req.nextUrl.searchParams.get('filter') || 'all';

    const items = await listContentItems(uid, filter);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error listing content:", error);
    return NextResponse.json(
      { error: "Failed to list content" },
      { status: 500 }
    );
  }
}

