"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Link from "next/link";

export default function BetaWaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!db) {
      setError("Waitlist signups are temporarily unavailable. Please try again later.");
      return;
    }

    try {
      setStatus("submitting");
      await addDoc(collection(db, "betaWaitlist"), {
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        source: "public-beta-gate",
      });
      setEmail("");
      setStatus("success");
    } catch (err) {
      console.error("Error saving beta waitlist email:", err);
      setError("Something went wrong saving your signup. Please try again.");
      setStatus("error");
    }
  };

  const disabled = status === "submitting" || status === "success";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-black tracking-tight">
            +AI
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Private beta
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            The current +AI beta is full — but you can still get in early.
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            We&apos;re onboarding a small group of creators and families while we harden security,
            voice fingerprinting, and model routing. Join the waitlist below and we&apos;ll email
            you as soon as the next beta cohort opens.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 w-full max-w-md space-y-3">
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              disabled={disabled}
              required
            />
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-500"
            >
              {status === "submitting" ? "Joining waitlist..." : "Join the +AI beta waitlist"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {status === "success" && !error && (
            <p className="text-xs text-emerald-600">
              You&apos;re on the list. We&apos;ll reach out as soon as a new beta slot opens.
            </p>
          )}
        </form>

        <p className="mt-6 text-xs text-gray-500 max-w-sm">
          We&apos;ll only use your email to contact you about +AI beta access and major product
          updates. No spam, no selling your data.
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-8 text-xs font-semibold text-gray-500 underline-offset-4 hover:underline"
        >
          Back to home page
        </button>
      </main>
    </div>
  );
}


