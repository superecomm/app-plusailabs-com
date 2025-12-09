"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { NewsroomTopNav } from "@/components/NewsroomTopNav";
import newsIcon from "@/assets/plusailabs brand assets/Group 4774.png";

type Article = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  date: string;
  image?: string;
  link?: string;
  external?: boolean;
};

const categories = [
  "AI Safety",
  "Voice Security",
  "Entertainment",
  "Creator Protection",
  "Deepfake Intelligence",
  "Tech Updates",
  "Research & Publications",
  "Company Updates",
];

const articles: Article[] = [
  {
    slug: "voice-cloning-age-of-generative-ai",
    category: "AI Safety",
    title: "In the Age of AI, the Human Voice Has Never Been More Vulnerable — or More Worth Protecting",
    summary:
      "New +AI newsroom brief on voice cloning risks, detection, consent, and governance, drawn from SSRN 4850866 and updated household/enterprise guidance.",
    date: "January 15, 2025",
    image: "/newsroom/voice-cloning-generative-ai.webp",
    external: false,
    link: "/newsroom/voice-cloning-age-of-generative-ai",
  },
  {
    slug: "fbi-issues-warning-ai-cloned-voice-family-scams",
    category: "AI Safety",
    title: "FBI issues warning: AI-cloned voices fuel a wave of family emergency scams",
    summary:
      "New FBI bulletin highlights rising deepfake voice scams targeting families. Patterns, red flags, and how +AI voice locks and detection can help.",
    date: "December 5, 2025",
    image: "/newsroom/fbi-scam-hero.avif",
    external: false,
    link: "/newsroom/fbi-issues-warning-ai-cloned-voice-family-scams",
  },
  {
    slug: "netflix-effect-family-ai",
    category: "Entertainment",
    title: "The Netflix Effect for AI: Why Families Will Soon Share a Homewide Intelligence System",
    summary:
      "From solo assistants to shared family AI. A look at the coming shift to homewide intelligence systems, family LLMs, and why collective AI is the next household utility.",
    date: "December 6, 2025",
    image: "/newsroom/netflix-effect-family-ai.jpg",
    external: false,
    link: "/newsroom/netflix-effect-family-ai",
  },
];

export default function NewsroomPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowFab(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = selectedCategory
    ? articles.filter((a) => a.category === selectedCategory)
    : articles;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <NewsroomTopNav />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10">
        <section className="space-y-3 border-b border-gray-200 pb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1">
            <Image src={newsIcon} alt="+AI Labs News" width={20} height={20} className="h-4 w-auto" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-600">Newsroom</p>
          </div>
          <h1 className="text-4xl font-black leading-tight md:text-5xl">
            Stay informed on AI industry updates
          </h1>
          <p className="text-base text-gray-600">
            AI safety, voice security, entertainment, creator protection, and deepfake intelligence from the +AI Labs team.
          </p>
        </section>

        <section className="sticky top-16 z-20 border-b border-gray-100 bg-white">
          <div className="relative mx-auto max-w-6xl px-4">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            <div className="overflow-x-auto py-3 scrollbar-hide">
              <div className="flex min-w-max gap-2 text-sm">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    selectedCategory === null
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-8">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">No articles in this category yet.</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article) => (
                <article key={article.slug} className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
                  {article.image && (
                    <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-gray-100">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{article.category}</p>
                    <h3 className="text-lg font-semibold leading-snug text-gray-900 group-hover:text-gray-700">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-700 line-clamp-3">{article.summary}</p>
                    <p className="text-xs text-gray-500">{article.date}</p>
                    <div className="mt-auto pt-2">
                      {article.link ? (
                        article.external ? (
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
                          >
                            View source ↗
                          </a>
                        ) : (
                          <Link
                            href={article.link}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
                            target="_blank"
                          >
                            Read article ↗
                          </Link>
                        )
                      ) : (
                        <span className="text-sm text-gray-500">Coming soon</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-gradient-to-r from-black to-gray-900 px-6 py-10 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-300">Stay informed</p>
              <h2 className="text-2xl font-bold">Get +AI voice security updates</h2>
              <p className="text-sm text-gray-200">
                Threat intelligence, family safety tips, and creator protection news.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/subscribe"
                className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-100"
              >
                Join +AI
              </Link>
              <Link
                href="mailto:hello@superplusai.com?subject=Newsroom%20updates&body=Please%20add%20me%20to%20the%20+AI%20newsroom%20updates."
                className="rounded-md border border-white/60 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Get updates
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FAB to top CTA */}
      {showFab && (
        <Link
          href="/subscribe"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
        >
          Join +AI
        </Link>
      )}

      <Footer />
    </div>
  );
}

