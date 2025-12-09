import { getAdminFirestore } from "./firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { SubscriptionPlan, SubscriptionStatus, UserSubscription } from "./data/types";

export function getPriceIdForPlan(plan: SubscriptionPlan): string | null {
  switch (plan) {
    case "plus":
      return process.env.STRIPE_PRICE_PLUS || null;
    case "super":
      return process.env.STRIPE_PRICE_SUPER || null;
    case "free":
      return null;
    default:
      return null;
  }
}

export function planFromPriceId(priceId?: string | null): SubscriptionPlan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PLUS) return "plus";
  if (priceId === process.env.STRIPE_PRICE_SUPER) return "super";
  return null;
}

export function stripeStatusToSubscriptionStatus(status: string): SubscriptionStatus {
  const allowed: SubscriptionStatus[] = [
    "active",
    "trialing",
    "past_due",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "unpaid",
  ];
  return (allowed as string[]).includes(status) ? (status as SubscriptionStatus) : "incomplete";
}

export async function upsertUserSubscription(input: {
  userId: string;
  planId: SubscriptionPlan;
  status: SubscriptionStatus;
  priceId?: string | null;
  currentPeriodEnd?: number | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  checkoutSessionId?: string | null;
}) {
  const firestore = getAdminFirestore();

  const payload: Partial<UserSubscription> = {
    userId: input.userId,
    planId: input.planId,
    status: input.status,
    priceId: input.priceId || undefined,
    customerId: input.customerId || undefined,
    subscriptionId: input.subscriptionId || undefined,
    checkoutSessionId: input.checkoutSessionId || undefined,
    // Admin Timestamp cast to client Timestamp shape
    updatedAt: Timestamp.now() as unknown as any,
  };

  if (input.currentPeriodEnd) {
    payload.currentPeriodEnd = Timestamp.fromMillis(input.currentPeriodEnd * 1000) as unknown as any;
  }

  const docRef = firestore.collection("subscriptions").doc(input.userId);
  await docRef.set(
    {
      ...payload,
      createdAt: Timestamp.now() as unknown as any,
    },
    { merge: true }
  );
}

