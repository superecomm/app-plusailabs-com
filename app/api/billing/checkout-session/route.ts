import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { planFromPriceId, stripeStatusToSubscriptionStatus, upsertUserSubscription } from "@/lib/subscriptions";
import type { SubscriptionPlan } from "@/lib/data/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2025-11-17.clover",
  });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId as SubscriptionPlan | undefined;

    const subscription = session.subscription as Stripe.Subscription | null;
    const priceId = subscription?.items?.data?.[0]?.price?.id;
    const derivedPlan = planId || planFromPriceId(priceId);
    const status = subscription?.status ? stripeStatusToSubscriptionStatus(subscription.status) : "incomplete";
    const currentPeriodEnd = (subscription as any)?.current_period_end ?? null;

    if (userId && derivedPlan) {
      await upsertUserSubscription({
        userId,
        planId: derivedPlan,
        status,
        priceId: priceId || undefined,
        currentPeriodEnd,
        customerId: (subscription?.customer as string) || null,
        subscriptionId: subscription?.id || null,
        checkoutSessionId: session.id,
      });
    }

    return NextResponse.json({
      status: session.payment_status,
      subscriptionStatus: status,
      plan: derivedPlan ?? null,
    });
  } catch (error) {
    console.error("Failed to verify checkout session", error);
    return NextResponse.json({ error: "Unable to verify session" }, { status: 500 });
  }
}

