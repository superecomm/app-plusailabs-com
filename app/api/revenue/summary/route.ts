import { NextRequest, NextResponse } from "next/server";
import { getSellerRevenue } from "@/lib/commerce/transactions";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const [today, week, month, allTime] = await Promise.all([
      getSellerRevenue(userId, 'today'),
      getSellerRevenue(userId, 'week'),
      getSellerRevenue(userId, 'month'),
      getSellerRevenue(userId, 'all'),
    ]);

    return NextResponse.json({
      today,
      week,
      month,
      allTime,
    });
  } catch (error) {
    console.error("Error fetching revenue summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue" },
      { status: 500 }
    );
  }
}

