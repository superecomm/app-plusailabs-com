import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPriceIdForPlan } from "@/lib/subscriptions";
import type { SubscriptionPlan } from "@/lib/data/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-11-17.clover",
    });

    const { planId }: { planId?: SubscriptionPlan } = await req.json();
    const userId = req.headers.get("x-user-id") || undefined;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId header" }, { status: 401 });
    }

    if (!planId || planId === "free") {
      return NextResponse.json({ error: "Paid planId required" }, { status: 400 });
    }

    const priceId = getPriceIdForPlan(planId);
    if (!priceId) {
      return NextResponse.json({ error: `Missing price ID for plan ${planId}` }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const origin = req.headers.get("origin") || baseUrl;
    const successUrl = process.env.STRIPE_SUCCESS_URL || `${origin}/subscribe/return?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${origin}/subscribe?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: successUrl.includes("{CHECKOUT_SESSION_ID}")
        ? successUrl
        : `${successUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: cancelUrl,
      customer_email: undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      subscription_data: {
        metadata: {
          userId,
          planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

