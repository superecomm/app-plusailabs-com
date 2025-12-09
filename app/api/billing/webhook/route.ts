import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getPriceIdForPlan,
  planFromPriceId,
  stripeStatusToSubscriptionStatus,
  upsertUserSubscription,
} from "@/lib/subscriptions";
import type { SubscriptionPlan } from "@/lib/data/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe secrets not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: "2025-11-17.clover",
  });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId as SubscriptionPlan | undefined;
        if (userId && planId) {
          await upsertUserSubscription({
            userId,
            planId,
            status: "active",
            priceId: getPriceIdForPlan(planId),
            currentPeriodEnd: null,
            customerId: (session.customer as string) || null,
            subscriptionId: (session.subscription as string) || null,
            checkoutSessionId: session.id,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = (subscription.metadata as any)?.userId as string | undefined;
        const planIdMetadata = (subscription.metadata as any)?.planId as SubscriptionPlan | undefined;
        const priceId = subscription.items.data[0]?.price?.id;
        const planId = planIdMetadata || planFromPriceId(priceId);

        if (userId && planId) {
          await upsertUserSubscription({
            userId,
            planId,
            priceId: priceId || undefined,
            status: stripeStatusToSubscriptionStatus(subscription.status),
            currentPeriodEnd: (subscription as any)?.current_period_end,
            customerId: (subscription.customer as string) || null,
            subscriptionId: subscription.id,
            checkoutSessionId: subscription.latest_invoice as string | null,
          });
        }
        break;
      }
      default:
        // Ignore other events
        break;
    }
  } catch (error) {
    console.error("Error handling Stripe webhook", error);
    return NextResponse.json({ error: "Webhook handling error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

