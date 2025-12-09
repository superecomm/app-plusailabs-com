"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import VIIMAnimation from "@/components/viim/VIIMAnimation";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  const topCtaRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const el = topCtaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top = window.scrollY + rect.top;
      const trigger = top + rect.height;
      setShowFab(window.scrollY > trigger);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src={plusAi} alt="+AI" width={53} height={14} priority />
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <button
              onClick={() => setSideOpen(true)}
              className={`h-7 w-16 rounded-md transition shadow-inner ${
                sideOpen ? "bg-gray-900" : "bg-gray-300"
              }`}
              aria-label="Open menu"
            >
              <span
                className={`block h-3 w-6 rounded-sm bg-white transition-transform duration-200 ${
                  sideOpen ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-24 pt-12">
        <section
          ref={topCtaRef}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Link
            href="/super-plus-ai/mobile?auth=1"
            className="rounded-[32px] p-1 transition hover:scale-[1.01] hover:drop-shadow-xl"
            aria-label="Launch +AI"
          >
            <VIIMAnimation state="idle" size="md" container="square" visualStyle="particles" />
          </Link>
          <p className="text-base font-semibold text-gray-900">Tap to launch +AI</p>
        </section>

        <section className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">
            About +AI
          </p>
          <h1 className="text-3xl font-black leading-tight md:text-4xl">
            +AI is a new way of working, thinking, and creating.
          </h1>
          <div className="prose max-w-none text-gray-800 prose-p:leading-relaxed prose-headings:font-semibold">
            <p><strong>+AI is a new way of working, thinking, and creating.</strong></p>
            <p><em>It means adding intelligence to your everyday life — not replacing it.</em></p>
            <p><strong>It stands for empowered humans, not automated humans.</strong></p>
            <p><strong>+AI is the belief</strong> that technology should amplify identity, not erase it. It should enhance creativity, not steal it. It should protect your voice, not mimic it without consent.</p>
            <p><strong>+AI means you stay in control</strong> — your ideas, your voice, your identity. <em>+AI is human-first.</em></p>
            <p>AI today often asks people to adapt to the machine. <strong>+AI asks the machine to adapt to people.</strong></p>
            <p><strong>With +AI:</strong></p>
            <ul>
              <li><strong>Your voice is yours.</strong></li>
              <li><strong>Your identity is secured.</strong></li>
              <li><strong>Your creativity is protected.</strong></li>
              <li><strong>Your ideas belong to you.</strong></li>
            </ul>
            <p>Technology should lift us, not take from us. <strong>+AI is safe intelligence.</strong></p>
            <p>AI has power — but power without protection becomes a threat. <strong>+AI is built on one fundamental truth: Intelligence without security is not intelligence at all.</strong></p>
            <p><em>Every interaction begins with trust. Every model sits behind protection. Every creation is backed by your identity.</em> +AI makes safety invisible, automatic, and universal.</p>
            <p><strong>+AI is many models, one experience.</strong> The future is not one AI — it’s all AI. Different models excel at different tasks. +AI doesn’t force a choice; it unifies them.</p>
            <p>
              GPT for reasoning. Claude for writing. Gemini for knowledge. Grok for speed. Open models for transparency.
              Vision models for context. Voice models for expression. <strong>All inside one secure assistant.</strong> This is +AI.
            </p>
            <p><strong>+AI is creativity without limits.</strong></p>
            <p>Ideas don’t live in one format — they flow across: text, voice, images, video, audio, concepts, prototypes. +AI lets them transform freely. A voice note becomes a screenplay. A photo becomes a design. A thought becomes a business. With +AI, creation becomes natural again.</p>
            <p><strong>+AI is identity in the age of infinite copies.</strong></p>
            <p>AI can clone voices, mimic faces, generate fakes, rewrite truth. +AI stands against that. <strong>Your voice becomes a fingerprint. Your identity becomes encrypted. Your likeness becomes protected. Your creative work becomes licensed — not stolen.</strong> In the future, identity is the new currency. +AI lets you own it.</p>
            <p><strong>+AI is the next step beyond Artificial Intelligence.</strong></p>
            <p>
              It’s not about making machines smarter. It’s about making you stronger. <strong>+AI puts the “plus” in:</strong> your thinking,
              your creativity, your expression, your productivity, your identity, your security.
            </p>
            <p><strong>It’s not machine vs human. It’s human plus machine.</strong></p>
            <p>+AI is the intelligence that works for you — and belongs to you.</p>
            <p><em>Not a black box. Not a risk. Not a replacement. Not a surveillance tool.</em> But a partner.</p>
            <p>A creative partner. A thinking partner. A learning partner. A security partner.</p>
            <p><strong>Your intelligence, amplified. Your identity, protected. Your creativity, unlocked.</strong></p>
            <p>This is +AI.</p>
          </div>
        </section>
      </main>

      {showFab && (
        <Link
          href="/super-plus-ai/mobile?auth=1"
          className="fixed bottom-6 right-6 z-50 transition hover:scale-105"
          aria-label="Launch Super +AI"
        >
          <VIIMAnimation state="idle" size="xxs" container="square" visualStyle="particles" />
        </Link>
      )}

      {sideOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setSideOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-2xl ring-1 ring-black/10 transition">
            <div className="p-4 space-y-3 text-sm font-semibold text-gray-800 mt-12">
              <Link
                href="/about"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                About +AI
              </Link>
              <Link
                href="/pricing"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                Pricing
              </Link>
              <Link
                href="/beta-waitlist"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                Beta waitlist
              </Link>
              <Link
                href="/subscribe"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                Get started
              </Link>
              <Link
                href="/family"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                Family Plan
              </Link>
              <Link
                href="/newsroom"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                Newsroom
              </Link>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}

