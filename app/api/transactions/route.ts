import { NextRequest, NextResponse } from "next/server";
import { logPurchase } from "@/lib/commerce/transactions";

export async function POST(req: NextRequest) {
  try {
    const { userId, productId, amount, sellerId, type } = await req.json();

    if (!userId || !productId || !amount || !sellerId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transactionId = await logPurchase({
      userId,
      productId,
      amount,
      sellerId,
      type,
    });

    return NextResponse.json({ success: true, transactionId });
  } catch (error) {
    console.error("Error logging purchase:", error);
    return NextResponse.json(
      { error: "Failed to log purchase" },
      { status: 500 }
    );
  }
}

