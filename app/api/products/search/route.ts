import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const maxPrice = req.nextUrl.searchParams.get("maxPrice");
  const minPrice = req.nextUrl.searchParams.get("minPrice");
  const keywords = req.nextUrl.searchParams.get("keywords");

  try {
    const db = getAdminFirestore();
    
    // Start with base query
    let query: any = db.collection('contentItems')
      .where('visibility', '==', 'public');
    
    // Filter by product or drop types
    // Note: Firestore doesn't support OR on different fields well
    // For v1, we'll query all public content and filter client-side
    
    const snapshot = await query.limit(50).get();
    
    let products = snapshot.docs
      .map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      })
      .filter((item: any) => item.type === 'product' || item.type === 'drop');
    
    // Client-side filtering
    if (category) {
      products = products.filter((p: any) => 
        p.aiContext?.category === category ||
        p.tags?.includes(category)
      );
    }
    
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      products = products.filter((p: any) => p.product?.price <= max);
    }
    
    if (minPrice) {
      const min = parseFloat(minPrice);
      products = products.filter((p: any) => p.product?.price >= min);
    }
    
    if (keywords) {
      const keywordList = keywords.split(',').map(k => k.trim().toLowerCase());
      products = products.filter((p: any) => {
        const searchText = `${p.title} ${p.body} ${p.tags?.join(' ')}`.toLowerCase();
        return keywordList.some(keyword => searchText.includes(keyword));
      });
    }
    
    // Limit results
    products = products.slice(0, 10);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}

