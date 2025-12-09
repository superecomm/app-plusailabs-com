import Link from "next/link";
import { NewsroomTopNav } from "@/components/NewsroomTopNav";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "FBI issues warning: AI-cloned voices fuel a wave of family emergency scams",
  description:
    "+AI Newsroom — National Security & Cybercrime Desk: FBI bulletin on AI-cloned voice family emergency scams, tactics, red flags, and household protections.",
  alternates: {
    canonical: "https://www.superplusai.com/newsroom/fbi-issues-warning-ai-cloned-voice-family-scams",
  },
  openGraph: {
    title: "FBI issues warning: AI-cloned voices fuel a wave of family emergency scams",
    description:
      "+AI Newsroom — National Security & Cybercrime Desk: FBI bulletin on AI-cloned voice family emergency scams, tactics, red flags, and household protections.",
    images: [
      {
        url: "https://www.superplusai.com/newsroom/fbi-scam-hero.avif",
        width: 1200,
        height: 630,
        alt: "Phone scam warning graphic",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FBI issues warning: AI-cloned voices fuel a wave of family emergency scams",
    description:
      "+AI Newsroom — National Security & Cybercrime Desk: FBI bulletin on AI-cloned voice family emergency scams, tactics, red flags, and household protections.",
    images: ["https://www.superplusai.com/newsroom/fbi-scam-hero.avif"],
  },
};

export default function FbiScamArticle() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <NewsroomTopNav />
      <article className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-600">AI Safety · Consumer Warning</p>
          <h1 className="text-3xl font-black leading-tight md:text-4xl">
            FBI issues warning: AI-cloned voices fuel a wave of family emergency scams
          </h1>
          <p className="text-sm text-gray-500">December 5, 2025 · FBI bulletin · +AI Newsroom</p>
          <div className="relative overflow-hidden rounded-2xl bg-gray-50">
            <img
              src="/newsroom/fbi-scam-hero.avif"
              alt="Phone scam warning graphic"
              className="w-full h-auto object-cover"
            />
          </div>
          <p className="text-base text-gray-700">
            +AI Newsroom — National Security & Cybercrime Desk. The FBI has issued urgent warnings as Americans face AI-cloned
            voice “family emergency” scams. Attackers clone loved ones with seconds of audio and pressure victims to send money
            fast. This report summarizes the FBI bulletin “AI-Cloned Voices Fuel a Dangerous Wave of Family Emergency Scams.”
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">A new kind of crime</h2>
          <p className="text-sm text-gray-800 leading-relaxed">
            Scammers now sound exactly like your child, parent, or grandparent. They scrape seconds of audio from social media,
            livestreams, or voicemails, clone it with generative AI, then launch emotional “family emergency” hoaxes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">How the AI voice scam unfolds</h2>
          <ol className="list-decimal space-y-2 pl-5 text-gray-800 text-sm leading-relaxed">
            <li>
              <span className="font-semibold">Emotional hijacking:</span> The call sounds exactly like your loved one—crying,
              panicked, urgent.
            </li>
            <li>
              <span className="font-semibold">Manufactured emergency:</span> Claims of arrest, kidnapping, injury, or legal crisis.
            </li>
            <li>
              <span className="font-semibold">Forced secrecy & urgency:</span> “Don’t call anyone. Don’t call the police.”
            </li>
            <li>
              <span className="font-semibold">Demands for untraceable payments:</span> Cash drop-offs, crypto, wires, gift cards,
              instant payment apps.
            </li>
          </ol>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-xl bg-gray-50">
              <img src="/newsroom/fbi-scam-1.png" alt="FBI scam screenshot 1" className="w-full h-auto object-cover" />
            </div>
            <div className="relative overflow-hidden rounded-xl bg-gray-50">
              <img src="/newsroom/fbi-scam-2.png" alt="FBI scam screenshot 2" className="w-full h-auto object-cover" />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Why these scams are spreading</h2>
          <ul className="list-disc space-y-2 pl-5 text-gray-800 text-sm leading-relaxed">
            <li>Seconds of public audio are enough to clone a voice.</li>
            <li>Fraudsters automate hundreds of calls, often targeting the elderly.</li>
            <li>Caller ID spoofing makes calls look familiar or “official.”</li>
            <li>Low-cost AI + real-time translation = global, multilingual scams.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">How to protect your family</h2>
          <ol className="list-decimal space-y-2 pl-5 text-gray-800 text-sm leading-relaxed">
            <li>
              <span className="font-semibold">Create a family codeword:</span> A private phrase only close relatives know (e.g.,
              “Grandma’s Cookies”). If the caller can’t repeat it, hang up.
            </li>
            <li>
              <span className="font-semibold">Independently verify:</span> Hang up and call back using saved numbers; cross-check
              with another relative.
            </li>
            <li>
              <span className="font-semibold">Reduce public audio:</span> Limit who can view your stories, voice notes, and posts.
            </li>
            <li>
              <span className="font-semibold">Be skeptical of speed + secrecy:</span> Gift cards, crypto, instant wires, and “don’t
              tell anyone” are red flags.
            </li>
            <li>
              <span className="font-semibold">Enable MFA everywhere:</span> Protect accounts even if your voice is spoofed to
              support reps.
            </li>
          </ol>
          <div className="relative overflow-hidden rounded-xl bg-gray-50">
            <img src="/newsroom/fbi-scam-hero.avif" alt="Unknown caller phone call" className="w-full h-auto object-cover" />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">If you are targeted or victimized</h2>
          <p className="text-sm text-gray-800 leading-relaxed">
            Report immediately—early action improves recovery odds and helps law enforcement track patterns.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-gray-800 text-sm leading-relaxed">
            <li>FBI Internet Crime Complaint Center (IC3): www.ic3.gov</li>
            <li>Federal Trade Commission (FTC): reportfraud.ftc.gov</li>
            <li>Your local police department for a case number.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">Read the bulletin</h2>
          <p className="text-sm text-gray-800 leading-relaxed">
            For the full FBI-related briefing and guidance, access the PDF below.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/newsroom"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-900"
            >
              Back to Newsroom
            </Link>
          </div>
          <p className="text-xs text-gray-500">
            Source: “FBI Issues New Warning: AI-Cloned Voices Fuel a Dangerous Wave of Family Emergency Scams” (PDF).
          </p>
        </section>
      </article>
      <Footer />
    </div>
  );
}

