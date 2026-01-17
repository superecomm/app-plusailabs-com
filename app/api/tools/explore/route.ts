import { NextRequest, NextResponse } from "next/server";

/**
 * Tool execution endpoint for explore/search tools
 */
export async function POST(req: NextRequest) {
  try {
    const { tool, parameters } = await req.json();

    if (tool === "search_explore") {
      const { query, filter = "for-you", maxResults = 10 } = parameters || {};
      
      if (!query) {
        return NextResponse.json({ error: "Query is required" }, { status: 400 });
      }

      // Call the explore feed API
      const feedUrl = new URL("/api/explore/feed", req.nextUrl.origin);
      feedUrl.searchParams.set("filter", filter);
      
      const feedResponse = await fetch(feedUrl.toString());
      if (!feedResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch explore feed" }, { status: 500 });
      }

      const feedData = await feedResponse.json();
      const items = feedData.items || [];

      // Simple keyword matching (in production, use proper search)
      const queryLower = query.toLowerCase();
      const matchingItems = items
        .filter((item: any) => {
          const searchText = `${item.title || ""} ${item.body || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
          return searchText.includes(queryLower);
        })
        .slice(0, maxResults);

      return NextResponse.json({
        tool: "search_explore",
        results: matchingItems,
        count: matchingItems.length
      });
    }

    if (tool === "get_product_details") {
      const { productId } = parameters || {};
      
      if (!productId) {
        return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
      }

      // Fetch product from Firestore via content API
      const contentUrl = new URL(`/api/content/${productId}`, req.nextUrl.origin);
      const contentResponse = await fetch(contentUrl.toString());
      
      if (!contentResponse.ok) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const product = await contentResponse.json();
      
      return NextResponse.json({
        tool: "get_product_details",
        product
      });
    }

    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  } catch (error) {
    console.error("Tool execution error:", error);
    return NextResponse.json({ error: "Tool execution failed" }, { status: 500 });
  }
}

