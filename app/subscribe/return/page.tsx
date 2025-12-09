"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Status = "loading" | "success" | "error";

function SubscribeReturnContent() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionId = params.get("session_id");
  const plan = params.get("plan");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("Verifying your subscription...");

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        setStatus("error");
        setMessage("Missing session_id.");
        return;
      }
      try {
        const res = await fetch(`/api/billing/checkout-session?session_id=${sessionId}`);
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Subscription updated. Redirecting you to +AI...");
          setTimeout(() => {
            router.push("/super-plus-ai/mobile");
          }, 1200);
        } else {
          throw new Error(data.error || "Unable to verify session.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Could not verify your subscription.");
      }
    };
    verify();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-gray-500">+AI Subscription</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {status === "loading" && "Finalizing your plan"}
          {status === "success" && "Success"}
          {status === "error" && "Something went wrong"}
        </h1>
        <p className="mt-3 text-gray-600">{message}</p>
        {plan && <p className="mt-2 text-sm text-gray-500">Plan: {plan}</p>}
        {status === "error" && (
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => router.push("/subscribe")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 hover:border-gray-900"
            >
              Back to plans
            </button>
            <button
              onClick={() => router.push("/super-plus-ai/mobile")}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              Go to app
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubscribeReturnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-gray-900">Loading…</div>}>
      <SubscribeReturnContent />
    </Suspense>
  );
}

