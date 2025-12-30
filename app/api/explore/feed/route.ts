import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const filter = req.nextUrl.searchParams.get("filter") || 'for-you';

  try {
    const db = getAdminFirestore();
    
    let query: any = db.collection('contentItems')
      .where('visibility', '==', 'public')
      .limit(50);
    
    // Apply filters
    if (filter === 'products') {
      // Filter to products/drops client-side since Firestore doesn't support OR well
    } else if (filter === 'videos') {
      // Filter to video content
    }
    
    const snapshot = await query.get();
    
    let items = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
    
    // Client-side filtering based on type
    if (filter === 'products') {
      items = items.filter((item: any) => item.type === 'product' || item.type === 'drop');
    } else if (filter === 'videos') {
      items = items.filter((item: any) => item.type === 'video');
    } else if (filter === 'trending') {
      // Sort by saves + views
      items.sort((a: any, b: any) => {
        const scoreA = (a.stats?.saves || 0) + (a.stats?.views || 0) / 10;
        const scoreB = (b.stats?.saves || 0) + (b.stats?.views || 0) / 10;
        return scoreB - scoreA;
      });
    }
    
    // Limit and shuffle for "for-you"
    if (filter === 'for-you') {
      items = shuffle(items).slice(0, 30);
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error generating feed:", error);
    return NextResponse.json(
      { error: "Failed to generate feed" },
      { status: 500 }
    );
  }
}

// Simple shuffle
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

