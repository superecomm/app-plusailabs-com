import { NextRequest, NextResponse } from "next/server";

/**
 * Tool execution endpoint for map/location tools
 */
export async function POST(req: NextRequest) {
  try {
    const { tool, parameters, location } = await req.json();

    if (tool === "search_nearby") {
      const { type, radius = 5, keywords } = parameters || {};
      
      if (!location || !location.lat || !location.lng) {
        return NextResponse.json({ error: "Location is required" }, { status: 400 });
      }

      // Call the map nearby API
      const nearbyUrl = new URL("/api/map/nearby", req.nextUrl.origin);
      nearbyUrl.searchParams.set("lat", location.lat.toString());
      nearbyUrl.searchParams.set("lng", location.lng.toString());
      nearbyUrl.searchParams.set("radius", radius.toString());
      if (type) {
        nearbyUrl.searchParams.set("type", type);
      }
      
      const nearbyResponse = await fetch(nearbyUrl.toString());
      if (!nearbyResponse.ok) {
        return NextResponse.json({ error: "Failed to fetch nearby content" }, { status: 500 });
      }

      const nearbyData = await nearbyResponse.json();
      let items = nearbyData.items || [];

      // Filter by keywords if provided
      if (keywords) {
        const keywordsLower = keywords.toLowerCase();
        items = items.filter((item: any) => {
          const searchText = `${item.title || ""} ${item.body || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
          return searchText.includes(keywordsLower);
        });
      }

      return NextResponse.json({
        tool: "search_nearby",
        results: items,
        count: items.length,
        location
      });
    }

    return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
  } catch (error) {
    console.error("Map tool execution error:", error);
    return NextResponse.json({ error: "Tool execution failed" }, { status: 500 });
  }
}

