import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "0");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") || "0");
  const radius = parseFloat(req.nextUrl.searchParams.get("radius") || "5"); // miles
  const type = req.nextUrl.searchParams.get("type"); // Filter by content type

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    // Get all public content with location
    // Note: For production, use geohashing or GeoFirestore for efficient geo queries
    const snapshot = await db
      .collection("contentItems")
      .where("visibility", "==", "public")
      .limit(100)
      .get();

    // Filter by distance client-side (simple v1)
    const items = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      })
      .filter((item: any) => {
        if (!item.location) return false;
        
        // Calculate distance
        const distance = calculateDistance(
          { lat, lng },
          { lat: item.location.lat, lng: item.location.lng }
        );
        
        return distance <= radius;
      })
      .filter((item: any) => {
        if (type) {
          return item.type === type;
        }
        return true;
      })
      .slice(0, 20);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error finding nearby content:", error);
    return NextResponse.json(
      { error: "Failed to find nearby content" },
      { status: 500 }
    );
  }
}

// Simple distance calculation (Haversine formula)
function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

