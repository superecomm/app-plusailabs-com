"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase/client";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { SubscriptionPlan } from "@/lib/data/types";
import Image from "next/image";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";

const betaClosed = process.env.NEXT_PUBLIC_BETA_CLOSED === "true";

const plans: Array<{
  id: SubscriptionPlan;
  name: string;
  price: string;
  subtitle?: string;
  features: string[];
  highlight?: boolean;
  comingSoon?: boolean;
}> = [
  {
    id: "free",
    name: "Free AI",
    price: "$0/mo",
    subtitle: "Limited access to models",
    features: ["Limited access to models", "Limited cloud storage", "Limited memory and context", "Analytics"],
  },
  {
    id: "plus",
    name: "+AI",
    price: "$25/mo",
    subtitle: "Expanded access to models",
    highlight: true,
    features: [
      "Everything in Free",
      "Expanded access to models",
      "Projects, tasks and team access",
      "Analytics",
    ],
  },
  {
    id: "super",
    name: "Super +AI",
    price: "$100/mo",
    subtitle: "Maximum memory and context",
    features: ["Everything in Plus", "Maximum memory and context", "Analytics"],
  },
  {
    id: "family",
    name: "Family (Coming Soon)",
    price: "Coming soon",
    subtitle: "Early Family Beta",
    features: [
      "Shared safety controls for families",
      "Curated prompts for kids & adults",
      "Weekend creative challenges",
      "Join the waitlist",
    ],
    comingSoon: true,
  },
];

export default function SubscribePage() {
  const { currentUser, userSubscription, loading } = useAuth();
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasActive = useMemo(
    () => userSubscription && userSubscription.status === "active",
    [userSubscription]
  );

  useEffect(() => {
    if (!loading && hasActive) {
      // Already subscribed, go to app
      router.push("/super-plus-ai/mobile");
    }
  }, [hasActive, loading, router]);

  const handleFree = async () => {
    if (!currentUser || !db) {
      setError("Please sign in to continue.");
      return;
    }
    try {
      setBusyPlan("free");
      await setDoc(
        doc(db, "subscriptions", currentUser.uid),
        {
          userId: currentUser.uid,
          planId: "free",
          status: "active",
          priceId: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.push("/super-plus-ai/mobile");
    } catch (err) {
      console.error(err);
      setError("Unable to activate Free plan.");
    } finally {
      setBusyPlan(null);
    }
  };

  const handlePaid = async (planId: SubscriptionPlan) => {
    if (!currentUser) {
      setError("Please sign in to continue.");
      return;
    }
    try {
      setBusyPlan(planId);
      setError(null);
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.uid,
        },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start checkout");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Checkout URL missing");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to start checkout.");
      setBusyPlan(null);
    }
  };

  const onSelect = (planId: SubscriptionPlan) => {
    if (betaClosed) {
      router.push("/beta-waitlist");
      return;
    }

    if (planId === "family") {
      setError("Family plan is coming soon. Join the waitlist!");
      return;
    }
    if (planId === "free") {
      handleFree();
    } else {
      handlePaid(planId);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Image src={plusAi} alt="+AI" width={120} height={32} />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Choose your plan</p>
            <h1 className="text-3xl font-bold text-gray-900">Choose your plan</h1>
          </div>
        </div>

        {(betaClosed || error) && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {betaClosed
              ? "The current +AI beta is full. Join the waitlist to get early access when new slots open."
              : error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border px-6 py-6 shadow-sm bg-white transition hover:-translate-y-1 hover:shadow-lg ${
                plan.highlight ? "border-gray-900" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{plan.name}</p>
                  <p className="text-sm text-gray-500">{plan.subtitle}</p>
                </div>
                {plan.highlight && (
                  <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Recommended
                  </span>
                )}
              </div>
              <div className="mt-4 text-3xl font-bold">{plan.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-900" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onSelect(plan.id)}
                disabled={busyPlan !== null || plan.comingSoon}
                className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  plan.comingSoon
                    ? "border border-dashed border-gray-300 text-gray-500 cursor-not-allowed"
                    : plan.highlight
                      ? "bg-gray-900 text-white hover:bg-black"
                      : "border border-gray-300 text-gray-900 hover:border-gray-900"
                } ${busyPlan === plan.id ? "opacity-60 cursor-wait" : ""}`}
              >
                {plan.comingSoon
                  ? "Coming soon"
                  : busyPlan === plan.id
                    ? "Processing..."
                    : plan.id === "free"
                      ? "Start for free"
                      : "Continue with Stripe"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Business / Enterprise / API? Contact us for custom terms.
        </p>
      </div>
    </div>
  );
}

