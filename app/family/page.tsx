import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FamilyTopNav } from "@/components/FamilyTopNav";
import familyHero from "@/assets/family-using-ai-home.jpg";
import familyDesk from "@/assets/family_using_computer.jpg";
import familyHappy from "@/assets/family-using-ai-happy-together.jpg";
import familyHome from "@/assets/family-using-ai-home.jpg";
import familyPhone from "@/assets/family-ai-phone.jpg";
import familyHappySmiling from "@/assets/family-using-ai-happy-together.jpg";
import creativeKids from "@/assets/creative-kids-image.jpg";
import familyComputer from "@/assets/family_using_computer.jpg";
import creativeUser from "@/assets/creative-user-in-music-shop.png";

export const metadata: Metadata = {
  title: "+AI Family Plan – Secure, shared AI for households",
  description:
    "The first shared AI subscription built for families. Safe, secure, and fun +AI with voice fingerprinting, parental controls, and multimodal tools for every age.",
  keywords: [
    "AI family plan",
    "family AI subscription",
    "shared AI account",
    "secure AI for families",
    "child-safe AI assistant",
    "AI for kids",
    "AI home plan",
    "household AI tools",
    "AI family pricing",
    "family generative AI plan",
  ],
  alternates: {
    canonical: "https://www.superplusai.com/ai-family-plan",
  },
};

const whatsIncluded = [
  {
    title: "Up to 5 family members",
    body: "Parents, kids, grandparents — one plan, one price.",
  },
  {
    title: "Shared AI bundle",
    body:
      "All members get +Chat, +Vision, +Voice, +Studio, and +Cloud — shared or private history options.",
  },
  {
    title: "Cybersecurity for Voice™ for everyone",
    body: "Anti-cloning, deepfake detection, identity verification, and kid-safe settings.",
  },
  {
    title: "Parental controls",
    body:
      "Enable/disable creative tools, restrict model types, view usage summaries, and lock identity permissions.",
  },
  {
    title: "Shared token pool (optional)",
    body:
      "One bucket for homework, stories, art, planning, and work. Tokens reset monthly.",
  },
  {
    title: "AI for every age",
    body:
      "Kids learn and create, teens research and build portfolios, adults plan and work, seniors get assistance and voice tools.",
  },
];

export default function FamilyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <FamilyTopNav />
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr,1fr] md:items-center">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-green-600">
                Coming soon to Super Plus AI
              </p>
              <h1 className="text-4xl font-black leading-tight md:text-5xl">
                +AI Family Plan — the first shared AI subscription for the modern household
              </h1>
              <p className="text-lg text-gray-600">
                Safe, secure, and fun +AI for the entire family. Voice fingerprinting, parental controls, and multimodal tools in one affordable plan.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/subscribe"
                  className="rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-black"
                >
                  Join the Family Plan waitlist
                </Link>
                <Link
                  href="mailto:hello@superplusai.com?subject=+AI%20Family%20Plan%20Waitlist&body=Hi%20Super%20Plus%20AI%2C%0AI%27d%20like%20to%20join%20the%20Family%20Plan%20waitlist.%20Please%20keep%20me%20posted%20on%20early%20access%20and%20founding%20pricing.%0A"
                  className="rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-900 hover:border-gray-900"
                >
                  Beta signup (email)
                </Link>
              </div>
              <div className="text-sm text-gray-500">
                Be first to bring secure generative AI into your household — early access, founding member pricing, and launch benefits.
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-50 shadow-sm">
              <Image src={familyHero} alt="Family using +AI together at home" fill className="object-cover" />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">
              Safe, secure, and fun +AI for the entire family
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md bg-gray-50 aspect-[16/9]">
                <Image src={familyComputer} alt="Family using +AI together on a computer" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Early Family Beta</p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  Be the first family with AI—early access to shared safety controls, curated prompts, and fun weekend challenges.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md bg-gray-50 aspect-[16/9]">
                <Image src={familyHome} alt="Family using +AI together at home" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Chat, Vision, Voice</p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  Multimodal prompts with live capture, transcription, and image understanding—all in one thread. Safe defaults for every family member.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md bg-gray-50 aspect-[16/9]">
                <Image src={creativeUser} alt="Creative using +AI" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Creatives & Artists</p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  Ideate, storyboard, and polish with models tuned for expression. Voice, vision, and writing in one secure creative flow.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md bg-gray-50 aspect-[16/9]">
                <Image src={familyPhone} alt="Parent and child using +AI on a phone" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Projects + Memory</p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  Keep briefs, drafts, and tasks together. Memory and context travel with you across devices—perfect for family projects and school work.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md bg-gray-50 aspect-[16/9]">
                <Image src={familyHappySmiling} alt="Family smiling while using +AI securely" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Secure by default</p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  Voice lock, audit-ready logging, and data controls so your identity and work stay protected. Safety-first for kids and adults.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative overflow-hidden rounded-md bg-gray-50 aspect-[16/9]">
                <Image src={creativeKids} alt="Kids creating with +AI" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-500">Switch models instantly</p>
                <p className="text-gray-800 text-sm leading-relaxed">
                  Route to GPT, Claude, Gemini, Grok and more without losing context. Pick the right model per task while staying in one safe workspace.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">
            Why an AI family plan now?
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">AI is the new household utility</h3>
              <p className="mt-3 text-gray-700">
                Just like WiFi, streaming, cloud storage, and family phone plans, AI is becoming essential for every member of the household.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900">One plan, no per-person friction</h3>
              <p className="mt-3 text-gray-700">
                Most AI apps charge per person. The +AI Family Plan removes individual paywalls so families can learn, create, and work together.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">What’s included</p>
            <h2 className="text-3xl font-bold text-gray-900">The +AI Family Plan bundle</h2>
            <p className="text-gray-700">
              Everything your household needs to chat, create, learn, and stay protected — under one shared subscription.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {whatsIncluded.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.18em] text-gray-600">{item.title}</p>
                <p className="mt-2 text-gray-800 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">
            Security first for every age
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Voice fingerprinting</h3>
              <p className="mt-2 text-sm text-gray-700">Identity lock and deepfake protection for kids and adults.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Safe model modes</h3>
              <p className="mt-2 text-sm text-gray-700">Filtered model options and kid-safe defaults for household use.</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Encrypted cloud</h3>
              <p className="mt-2 text-sm text-gray-700">Private family spaces plus shared history with clear audit trails.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">
            Built for real households
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-50 shadow-sm">
              <Image src={familyDesk} alt="Family using +AI together at a computer" fill className="object-cover" />
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-50 shadow-sm">
              <Image src={familyHappy} alt="Happy family using +AI together" fill className="object-cover" />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-gray-200 bg-gradient-to-r from-black to-gray-900 px-6 py-10 text-white">
          <p className="text-sm uppercase tracking-[0.22em] text-gray-300">Join the waitlist</p>
          <h3 className="text-3xl font-bold">Bring secure +AI into your household first</h3>
          <p className="text-gray-200">
            Early access, founding member pricing, and launch benefits when the +AI Family Plan goes live.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/subscribe"
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-100"
            >
              Join the Family Plan waitlist
            </Link>
            <Link
              href="mailto:hello@superplusai.com?subject=+AI%20Family%20Plan%20Waitlist&body=Hi%20Super%20Plus%20AI%2C%0AI%27d%20like%20to%20join%20the%20Family%20Plan%20waitlist.%20Please%20keep%20me%20posted%20on%20early%20access%20and%20founding%20pricing.%0A"
              className="rounded-md border border-white/60 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Beta signup via email
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

