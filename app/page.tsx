"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";
import butterfly from "@/assets/265-2651700_butterfly-transformation-removebg-preview_1755988178022-vqiVqxps 2.png";
import VIIMAnimation from "@/components/viim/VIIMAnimation";
import { ThreeLayerTrustBar } from "@/components/ThreeLayerTrustBar";
import { Footer } from "@/components/Footer";
import familyHome from "@/assets/family-using-ai-home.jpg";
import familyPhone from "@/assets/family-ai-phone.jpg";
import familyHappy from "@/assets/family-using-ai-happy-together.jpg";
import creativeKids from "@/assets/creative-kids-image.jpg";
import familyComputer from "@/assets/family_using_computer.jpg";
import creativeUser from "@/assets/creative-user-in-music-shop.png";
import chatgptLogo from "@/assets/chatgpt-white-transparent.png";
import claudeLogo from "@/assets/claude-white-transparent.png";
import deepseekLogo from "@/assets/deepseek-white-transparent.png";
import geminiLogo from "@/assets/gemini-white-transparent.png";
import grokLogo from "@/assets/grok-white-transparent.png";
import metaLogo from "@/assets/meta-white-transparent (1).png";
import perplexityLogo from "@/assets/perplexity-white-transparent.png";
import chatBlankScreen from "@/assets/ai-chatscreen-blank-iphone.png";
import chatModelSelector from "@/assets/ai-chat-screen-iphone.png";
import exploreFeed from "@/assets/ai-explore-screen-iphone.png";
import complianceCloud from "@/assets/download (2).jpg";

// Beta gate: by default the public is routed to the waitlist unless
// NEXT_PUBLIC_BETA_CLOSED is explicitly set to "false".
const betaClosed = process.env.NEXT_PUBLIC_BETA_CLOSED === "true";

const navLinks = [
  { href: "#models", label: "Models" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const modelLogos = [
  { alt: "GPT-5.1", src: chatgptLogo },
  { alt: "Claude", src: claudeLogo },
  { alt: "Gemini", src: geminiLogo },
  { alt: "Grok", src: grokLogo },
  { alt: "DeepSeek", src: deepseekLogo },
  { alt: "Perplexity", src: perplexityLogo },
  { alt: "Meta", src: metaLogo },
];

const chatFeatureBullets = [
  {
    title: "1,000+ Model Power",
    body: "Switch instantly between GPT, Claude, Gemini, Grok, open models, and more — all inside one simple chat.",
  },
  {
    title: "Voice, Image, and File Capture",
    body: "Create using whatever input works best in the moment — speak, snap, or upload and +AI handles the rest.",
  },
  {
    title: "Identity-Secure Fingerprinting",
    body: "Every piece of content is automatically linked to your trusted +AI identity for safer collaboration and sharing.",
  },
  {
    title: "Message Rewrite & Smart Prompting",
    body: "Clean, refine, and elevate your ideas in real time — no restarting threads or losing your creative flow.",
  },
];

const thousandModelsBullets = [
  {
    title: "Instant Model Switching",
    body: "Move your idea across GPT, Claude, Gemini, Grok, and hundreds more — instantly and seamlessly.",
  },
  {
    title: "Cross-Model Intelligence",
    body: "Start a draft in one model, enhance it in another, stylize it with a third, and finalize with a fourth. One flow. Zero friction.",
  },
  {
    title: "Fingerprint-Secure Creativity",
    body: "Every output is protected with your creator identity — your voice, name, image, and likeness remain yours.",
  },
  {
    title: "Higher Quality, Every Time",
    body: "+AI guides you to the model best suited for writing, editing, coding, analysis, music, or visual tasks.",
  },
  {
    title: "A Personal AI Supercomputer",
    body: "1,000+ models working together as one assistant — optimized for speed, creativity, and safety.",
  },
];

const exploreBullets = [
  {
    title: "A Trusted Feed of Verified Posts",
    body: "Every piece of content in Explore is backed by a voice–name–image–likeness fingerprint, so you always know who created what.",
  },
  {
    title: "Personalized Discovery",
    body: "+AI learns what you like and surfaces fingerprinted posts from creators, editors, musicians, storytellers, and thinkers.",
  },
  {
    title: "Instant Publishing From Chat",
    body: "Create something in Chat, power it with 1000 Models, tap Publish — it appears in Explore instantly.",
  },
  {
    title: "Share, Remix, and Build — Safely",
    body: "Reuse or respond to public content while keeping attribution, consent, and identity security intact.",
  },
  {
    title: "A Deepfake-Free Social Layer",
    body: "Verified identity means the Explore feed is safe for families, creators, professionals, and brands.",
  },
];

const featureGrid = [
  {
    title: "🧠 Model Switching, No Reset Required",
    body: "Jump between GPT, Claude, Gemini, Grok, and open-source models instantly without losing context or conversation history.",
  },
  {
    title: "👤 Reusable +AI Personas",
    body: "Create one persona and apply it across all AI models with a single click — perfect for roles, tone consistency, or multi-user families.",
  },
  {
    title: "📄 Inline Document Studio",
    body: "Write, refine, and export full documents (PDF, DOCX) directly inside chat. No exporting. No tool switching.",
  },
  {
    title: "✨ Prompt Enhancer",
    body: "Turn rough ideas into structured, high-performance prompts automatically — optimized for any model you choose.",
  },
  {
    title: "👥 Family & Team Collaboration",
    body: "Invite family members, collaborators, or teammates into shared chats. Control who can view, edit, or contribute.",
  },
  {
    title: "🌐 Integrated Web + File Search",
    body: "Pull in articles, sources, research, or upload files directly into the conversation. +AI analyzes everything in context.",
  },
];

const featureGridAlt = [
  {
    title: "🔄 Switch Models Mid-Chat",
    body: "Blend the strengths of different AI models without restarting your flow.",
  },
  {
    title: "🧩 Unified Personas Across Models",
    body: "Define how +AI should behave — then apply it universally.",
  },
  {
    title: "📝 Chat-Native Document Builder",
    body: "Draft, format, export. All inside the same thread.",
  },
  {
    title: "🌟 Smart Prompt Refinement",
    body: "Automatically upgrades your prompts for clarity and precision.",
  },
  {
    title: "👥 Secure Shared Workspaces",
    body: "Bring your team or household together with role-based access.",
  },
  {
    title: "🔍 Web Search + File Intelligence",
    body: "Search the web or upload files — +AI reads everything instantly.",
  },
];

const newsFeed = [
  {
    title: "In the Age of AI, the Human Voice Has Never Been More Vulnerable — or More Worth Protecting",
    summary: "Voice cloning risks, detection, consent, and governance—SSRN 4850866 insights for households and enterprises.",
    date: "January 15, 2025",
    image: "/newsroom/voice-cloning-generative-ai.webp",
    href: "/newsroom/voice-cloning-age-of-generative-ai",
    category: "AI Safety",
  },
  {
    title: "FBI issues warning: AI-cloned voices fuel a wave of family emergency scams",
    summary: "How scammers clone loved ones, red flags to spot, and +AI protections for households.",
    date: "December 5, 2025",
    image: "/newsroom/fbi-scam-hero.avif",
    href: "/newsroom/fbi-issues-warning-ai-cloned-voice-family-scams",
    category: "AI Safety",
  },
  {
    title: "The Netflix Effect for AI: Why Families Will Soon Share a Homewide Intelligence System",
    summary: "From solo assistants to shared family intelligence—why the Family LLM is the next household utility.",
    date: "December 6, 2025",
    image: "/newsroom/netflix-effect-family-ai.jpg",
    href: "/newsroom/netflix-effect-family-ai",
    category: "Entertainment",
  },
  {
    title: "Why Every Modern Creator Needs +AI: The New Survival Kit for Artists, Musicians & Digital Storytellers",
    summary: "Protect your voice, speed up releases, safeguard fans, and make smarter business decisions with +AI.",
    date: "December 7, 2025",
    image: "/newsroom/creators-need-plus-ai.webp",
    href: "/newsroom/creators-need-plus-ai",
    category: "Creator Protection",
  },
];

const pricingPlans = [
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
    comingSoon: true,
    features: [
      "Shared safety controls for families",
      "Curated prompts for kids & adults",
      "Weekend creative challenges",
      "Join the waitlist",
    ],
  },
];

const faqs = [
  { q: "Is +AI free to start?", a: "Yes. Start on Free AI, then upgrade to +AI or Super +AI anytime." },
  { q: "Do you support teams?", a: "Yes. Projects, tasks, and shared context are available on +AI and above." },
  { q: "What models are included?", a: "GPT-5.1, Claude, Gemini, Grok and more, with vision and voice where available." },
  { q: "Can I switch plans?", a: "Anytime. Changes take effect immediately after Stripe checkout or downgrade." },
];

export default function Home() {
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
          <nav className="hidden md:flex" />
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

      <main className="px-4 pb-24 pt-12">
        {/* Top CTA with Neural Box */}
        <section
          ref={topCtaRef}
          className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center"
        >
          <div className="flex flex-col items-center gap-4">
            <Link
              href={betaClosed ? "/beta-waitlist" : "/super-plus-ai/mobile?auth=1"}
              className="rounded-[32px] p-1 transition hover:scale-[1.01] hover:drop-shadow-xl"
              aria-label="Launch +AI"
            >
              <VIIMAnimation state="idle" size="md" container="square" visualStyle="particles" />
            </Link>
            <div className="space-y-2">
              <p className="text-base font-semibold text-gray-900">Tap to launch +AI</p>
            </div>
            <div className="pt-6">
              <Image
                src={butterfly}
                alt="Butterfly"
                width={220}
                height={140}
                className="h-auto w-44 md:w-56 -mb-6"
              />
            </div>
          </div>
        </section>

        {/* Hero */}
        <section className="mx-auto mt-12 flex max-w-5xl flex-col items-center gap-8 text-center">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex w-[200px] justify-center items-center whitespace-nowrap rounded-md bg-[#0fa958] px-5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white md:w-[240px] md:px-6 md:py-2 md:text-[11px] md:tracking-[0.18em]">
                Backed by Founder Institute
              </div>
              <div className="inline-flex w-[200px] justify-center items-center whitespace-nowrap rounded-md bg-gray-900 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white md:w-[240px] md:px-4 md:py-1.5 md:text-[11px] md:tracking-[0.2em]">
                The Cursor for Everyone
              </div>
            </div>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">
              1,000 AI Models in Your Pocket.
            </h1>
            <p className="max-w-2xl text-lg text-gray-600 mx-auto">
              The secure assistant that lets you switch models, create content, and protect your identity — all inside a single +AI workspace.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={betaClosed ? "/beta-waitlist" : "/subscribe"}
                className="rounded-md bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
              >
                Start now
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:border-gray-900"
              >
                View pricing
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-12 max-w-6xl">
          <ThreeLayerTrustBar />
        </div>

        {/* Chat: Create Anything Instantly */}
        <section className="mx-auto mt-16 max-w-6xl grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-xs md:max-w-sm">
              <Image
                src={chatBlankScreen}
                alt="+AI Chat blank screen"
                className="h-auto w-full"
                sizes="(max-width: 768px) 80vw, 320px"
                priority
              />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">Chat</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Create Anything Instantly</h2>
            <p className="text-base text-gray-700">
              Start with a blank canvas designed for clarity and focus — a clean, distraction-free space built for creative work.
            </p>
            <p className="text-base text-gray-700">
              Whether you&apos;re writing a message, brainstorming an idea, recording a voice prompt, or switching between models, +AI gives you the simplest,
              fastest space to create.
            </p>
            <div className="space-y-3 text-base text-gray-700">
              {chatFeatureBullets.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-base font-semibold text-gray-900">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-base text-gray-800 font-semibold">
              Chat is your creative engine — minimal UI, maximum capability.
            </p>
          </div>
        </section>

        {/* 1000 Models: Unlimited Intelligence at Your Fingertips */}
        <section className="mx-auto mt-16 max-w-6xl grid gap-10 md:grid-cols-2 md:items-center">
          <div className="flex items-center justify-center">
            <Image src={chatModelSelector} alt="+AI Chat with model selector" className="max-w-full h-auto" />
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">1000 models</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Unlimited Intelligence at Your Fingertips</h2>
            <p className="text-base text-gray-700">
              Switch between the world&apos;s best AI models in a single tap — all inside one secure workspace.
            </p>
            <p className="text-base text-gray-700">
              With +AI, you&apos;re not limited to one model&apos;s strengths. Brainstorm with GPT, refine with Claude, visualize with Gemini, analyze with Grok,
              compose with music models, generate with image models, and build with open-source models — all without losing context or identity.
            </p>
            <div className="space-y-3 text-base text-gray-700">
              {thousandModelsBullets.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-base font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="text-base text-gray-800 font-semibold">
              This is the power behind +AI — your ideas, amplified by every model on earth.
            </p>
          </div>
        </section>

        {/* Explore: Discover Fingerprinted, Human-Certified Content */}
        <section className="mx-auto mt-16 max-w-6xl grid gap-10 md:grid-cols-2 md:items-center">
          <div className="order-2 space-y-4 md:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">Explore</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Discover Fingerprinted, Human-Certified Content</h2>
            <p className="text-base text-gray-700">
              Explore is the world&apos;s first feed where every post comes from a verified human identity — protected by +AI fingerprinting.
            </p>
            <p className="text-base text-gray-700">
              No deepfakes, no stolen voices, no AI impersonators. Just real creators sharing real ideas, safely.
            </p>
            <div className="space-y-3 text-base text-gray-700">
              {exploreBullets.map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-base font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="text-base text-gray-800 font-semibold">
              Explore is where your ideas go to live, connect, and inspire — a new kind of social space built on trust.
            </p>
          </div>
          <div className="order-1 flex items-center justify-center md:order-2">
            <Image src={exploreFeed} alt="+AI Explore feed" className="max-w-full h-auto" />
          </div>
        </section>

        {/* Family collaboration */}
        <section className="mx-auto mt-16 max-w-6xl grid gap-10 md:grid-cols-2 md:items-center">
          <div className="order-2 space-y-4 md:order-1">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">AI for the whole family</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Family Collaboration Made Easy</h2>
            <p className="text-base text-gray-700">
              Bring your entire household into +AI with shared access, protected identities, and tools that keep everyone
              connected and secure.
            </p>
            <div className="space-y-3 text-base text-gray-700">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold text-gray-900">🧑‍🤝‍🧑 Simple Family Invitations</p>
                <p className="text-sm text-gray-600">Add parents, kids, or grandparents to shared chats instantly — no forwarding links, no lost threads.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold text-gray-900">👀 Kid-Safe View Mode</p>
                <p className="text-sm text-gray-600">Give younger family members read-only access so they can learn safely without modifying conversations.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold text-gray-900">🔐 Identity-Protected Profiles</p>
                <p className="text-sm text-gray-600">Each family member gets voice and likeness protection to prevent cloning or impersonation.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold text-gray-900">📁 Unified Family Files</p>
                <p className="text-sm text-gray-600">Upload homework, recipes, schedules, or photos — all accessible inside the shared +AI chat.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold text-gray-900">🎛️ Parent Controls</p>
                <p className="text-sm text-gray-600">Manage access, restrict tools, and assign permissions with a clean, intuitive interface.</p>
              </div>
            </div>
          </div>
          <div className="order-1 relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-900 via-gray-900 to-black shadow-lg md:order-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-white/0 to-white/5" />
            <div className="relative aspect-[4/3] w-full">
              <Image src="/trustbar-family.jpg" alt="Family collaboration preview" fill className="object-cover" />
            </div>
          </div>
        </section>

        {/* BIPA compliance feature wall */}
        <section className="mx-auto mt-16 max-w-6xl space-y-8">
          <div className="flex justify-center">
            <Image src={complianceCloud} alt="Compliance logo" width={120} height={120} className="h-14 w-auto rounded-lg" />
          </div>
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">
              BIPA Compliance
            </p>
            <p className="text-base text-gray-800 font-semibold">
              &ldquo;We&apos;re the opposite of Big Tech&apos;s model.&rdquo;
            </p>
            <p className="max-w-3xl mx-auto text-base text-gray-700">
              Every decision in +AI starts with consent, clarity, and user benefit — not ad revenue. Your biometric data,
              likeness, and voice are treated as sensitive identity assets, not a product to be sold.
            </p>
            <p className="max-w-3xl mx-auto text-sm text-gray-600 italic">
              &ldquo;We designed our entire business model around BIPA compliance because that&apos;s our competitive moat.&rdquo;
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
            <div className="border-b border-gray-100 pb-3 mb-2 text-xs md:text-sm font-semibold text-gray-900">
              <div className="grid grid-cols-12 items-center">
                <div className="col-span-6 text-left text-gray-500 font-medium">Question</div>
                <div className="col-span-3 text-center">Big Tech</div>
                <div className="col-span-3 text-center">+AI</div>
              </div>
            </div>
            <div className="space-y-2 text-xs md:text-sm text-gray-700">
              <div className="grid grid-cols-12 items-start py-1.5 gap-2">
                <p className="col-span-6 font-medium text-gray-900">Did you get consent?</p>
                <span className="col-span-3 text-center text-red-600">No</span>
                <span className="col-span-3 text-center text-emerald-700">Yes (explicit)</span>
              </div>
              <div className="grid grid-cols-12 items-start py-1.5 gap-2">
                <p className="col-span-6 font-medium text-gray-900">Is purpose clear?</p>
                <span className="col-span-3 text-center text-red-600">No (vague)</span>
                <span className="col-span-3 text-center text-emerald-700">Yes (protection)</span>
              </div>
              <div className="grid grid-cols-12 items-start py-1.5 gap-2">
                <p className="col-span-6 font-medium text-gray-900">Does the user benefit?</p>
                <span className="col-span-3 text-center text-red-600">No</span>
                <span className="col-span-3 text-center text-emerald-700">Yes (directly)</span>
              </div>
              <div className="grid grid-cols-12 items-start py-1.5 gap-2">
                <p className="col-span-6 font-medium text-gray-900">Can the user control their data?</p>
                <span className="col-span-3 text-center text-red-600">No</span>
                <span className="col-span-3 text-center text-emerald-700">Yes (full control)</span>
              </div>
              <div className="grid grid-cols-12 items-start py-1.5 gap-2">
                <p className="col-span-6 font-medium text-gray-900">Do you sell the data?</p>
                <span className="col-span-3 text-center text-red-600">Yes (ads)</span>
                <span className="col-span-3 text-center text-emerald-700">No (never)</span>
              </div>
              <div className="grid grid-cols-12 items-start py-1.5 gap-2">
                <p className="col-span-6 font-medium text-gray-900">Is retention justified?</p>
                <span className="col-span-3 text-center text-red-600">No</span>
                <span className="col-span-3 text-center text-emerald-700">Yes (ongoing monitoring)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Compliance */}
        <section className="mx-auto mt-16 max-w-6xl grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">Trust &amp; Compliance</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">Compliance-ready from day one.</h2>
            <p className="text-base text-gray-700">
              +AI is designed for the strictest biometric and privacy laws in the world—so you can safely use 1,000 models
              without worrying about the fine print.
            </p>
            <p className="text-base text-gray-700">
              We treat your voice, name, image, and likeness like financial data. Every interaction runs through an
              identity-safe pipeline built to align with current and emerging regulations across the U.S. and EU.
            </p>
            <div className="grid gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {[
                "Illinois BIPA (Biometric Information Privacy Act)",
                "California CCPA / CPRA",
                "Texas CUBI biometric protections",
                "Washington biometric privacy law",
                "GDPR coverage for EU users",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-gray-800">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800">
              “We designed our business model around BIPA and GDPR compliance.”
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="absolute left-3 top-3 z-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-900">
              Secure Identity Cloud
            </div>
            <div className="relative aspect-[4/3] w-full">
              <Image src={complianceCloud} alt="Secure identity cloud" fill className="object-contain p-6" />
            </div>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-900">
              {["Biometrics", "Privacy", "Audit Trail"].map((tag, idx) => (
                <span key={tag} className="flex items-center gap-2">
                  {idx !== 0 && <span className="text-gray-400">•</span>}
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
        <div className="mx-auto mt-4 max-w-6xl px-1 text-center">
          <Link
            href="/bipa"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-black"
          >
            View the BIPA Trust &amp; Compliance page →
          </Link>
        </div>

        {/* Feature grid */}
        <section id="features" className="mx-auto mt-16 max-w-6xl space-y-8">
          <div className="text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">Features</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Upload Files, Switch Models, Search the Web, Generate Videos — All Inside One +AI Workspace
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featureGrid.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-5 shadow-sm flex flex-col gap-2"
              >
                <p className="text-base font-semibold text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto mt-16 max-w-6xl space-y-10">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">Pricing</p>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              Access the Same AI Models Others Pay an arm and a leg for — from $0 to $100/mo
            </h2>
            <p className="text-base text-gray-700">Start on Free AI, upgrade anytime to +AI or Super +AI.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-[1.1fr,1.3fr]">
            <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <ul className="space-y-3 text-sm text-gray-800">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                  Infinite scalability — generate nonstop, no cooldowns, no rate limits (paid plans).
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                  All models included — access GPT, Claude, Gemini, Grok, and more with one fixed plan.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-gray-900" />
                  Instant top-ups — add more usage anytime without changing plans.
                </li>
              </ul>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-700 italic">
                  “An indispensable tool in my business arsenal.”
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-500">Casey Cease</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {pricingPlans.map((plan) => (
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
                  {plan.comingSoon ? (
                    <Link
                      href={betaClosed ? "/beta-waitlist" : "/family"}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold border border-dashed border-gray-300 text-gray-500 hover:border-gray-400"
                    >
                      Join waitlist
                    </Link>
                  ) : (
                    <Link
                      href={betaClosed ? "/beta-waitlist" : "/subscribe"}
                      className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        plan.highlight
                          ? "bg-gray-900 text-white hover:bg-black"
                          : "border border-gray-300 text-gray-900 hover:border-gray-900"
                      }`}
                    >
                      {plan.id === "free" ? "Start for free" : "Get started"}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsroom feed */}
        <section id="newsroom" className="mx-auto mt-16 max-w-6xl space-y-4">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">
              From the +AI Newsroom
            </p>
            <p className="text-base text-gray-600">
              Recent AI safety, family, and product updates.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {newsFeed.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] bg-gray-50">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{item.category}</p>
                  <h3 className="text-lg font-semibold leading-snug text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-700 line-clamp-3">{item.summary}</p>
                  <p className="text-xs text-gray-500">{item.date}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-gray-900">
                    Read more ↗
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Models highlight */}
        <section id="models" className="mx-auto mt-16 max-w-6xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm text-center space-y-4">
            <p className="text-sm uppercase tracking-[0.22em] text-gray-600">Models</p>
            <h2 className="text-3xl font-bold text-gray-900">
              Use Every Major AI Model — GPT, Claude, Gemini, Grok, Open Models
            </h2>
            <p className="text-base text-gray-600 max-w-3xl mx-auto">
              One secure assistant that lets you pick the best model for any task, mix strengths, and keep your identity protected inside a single +AI workspace.
            </p>

            {/* Mobile: ticker-style logo row without boxes */}
            <div className="block md:hidden">
              <div className="flex items-center gap-6 overflow-x-auto py-3 -mx-4 px-4">
                {modelLogos.map((model) => (
                  <div key={model.alt} className="flex-shrink-0">
                    <Image
                      src={model.src}
                      alt={model.alt}
                      width={160}
                      height={48}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop / tablet: boxed logos */}
            <div className="hidden md:flex md:flex-wrap md:items-center md:justify-center md:gap-5">
              {modelLogos.map((model) => (
                <div
                  key={model.alt}
                  className="rounded-2xl border border-gray-200 bg-gray-900 px-6 py-6 h-24 w-44 flex items-center justify-center shadow-sm"
                >
                  <Image
                    src={model.src}
                    alt={model.alt}
                    width={160}
                    height={48}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-16 max-w-6xl rounded-3xl border border-gray-200 bg-gradient-to-r from-black to-gray-800 p-8 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-gray-300">Ready to build?</p>
              <h3 className="text-3xl font-bold">
                {betaClosed ? "The current +AI beta is full — join the waitlist." : "Launch +AI now"}
              </h3>
              <p className="text-gray-200">
                {betaClosed
                  ? "We’re onboarding small creator and family cohorts while we harden security and model routing. Add your email to get first access when new slots open."
                  : "Start with Free, upgrade anytime. Your workspace, models, and memory stay in sync."}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={betaClosed ? "/beta-waitlist" : "/subscribe"}
                className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-gray-100"
              >
                {betaClosed ? "Join beta waitlist" : "Get started"}
              </Link>
              <Link
                href={betaClosed ? "/beta-waitlist" : "/pricing"}
                className="rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {betaClosed ? "Why we’re in private beta" : "View pricing"}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <div className="mx-auto mt-12 max-w-6xl">
          <ThreeLayerTrustBar />
        </div>
        <section id="faq" className="mx-auto mt-16 max-w-6xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.25em] text-gray-500">FAQ</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">Common questions</h3>
            <div className="mt-4 divide-y divide-gray-100">
              {faqs.map((item) => (
                <div key={item.q} className="py-4">
                  <p className="text-sm font-semibold text-gray-900">{item.q}</p>
                  <p className="mt-1 text-sm text-gray-600">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {showFab && (
        <Link
          href={betaClosed ? "/beta-waitlist" : "/super-plus-ai/mobile?auth=1"}
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
                href={betaClosed ? "/beta-waitlist" : "/subscribe"}
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
              <Link
                href="/bipa"
                onClick={() => setSideOpen(false)}
                className="block rounded-md px-3 py-2 hover:bg-gray-100"
              >
                BIPA Trust &amp; Compliance
              </Link>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
