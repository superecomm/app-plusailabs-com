"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import complianceCloud from "@/assets/download (2).jpg";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";
import { Footer } from "@/components/Footer";

const bipaBullets = [
  "Written consent before collecting biometrics (fingerprints, face/voice scans).",
  "Public retention & destruction policy; delete when purpose is met or within the stated window.",
  "Collect only for a clear, stated purpose; no hidden uses.",
  "No selling, leasing, or profiting from biometric data.",
  "Protect biometrics like other sensitive data (encryption, access controls).",
  "Private right of action with statutory damages — compliance is critical.",
];

const whatCovered = ["Fingerprints", "Retina / iris scans", "Voiceprints", "Hand or face geometry"];

const whatNotCovered = ["Physical descriptions (height, weight)", "Writing samples / signatures", "Biological samples for testing", "Tattoos or demographic data"];

export default function BipaPageClient() {
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Image src={plusAi} alt="+AI" width={48} height={14} priority />
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            <button
              onClick={() => setSideOpen(true)}
              className={`h-7 w-16 rounded-md transition shadow-inner ${sideOpen ? "bg-gray-900" : "bg-gray-300"}`}
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

      <main className="px-4 pb-20 pt-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr] md:items-center">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.26em] text-gray-500">
                CIVIL LIABILITIES (740 ILCS 14/) Biometric Information Privacy Act.
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-600">BIPA Trust &amp; Compliance</p>
              <h1 className="text-4xl font-bold leading-tight">Built to comply with BIPA from day one.</h1>
              <p className="text-base text-gray-700">
                Illinois&apos; Biometric Information Privacy Act (BIPA) requires informed consent, strict purpose limits, secure handling, and deletion of biometric data. Each
                violation can carry statutory damages ($1k negligent / $5k reckless), making compliance a core product requirement.
              </p>
              <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {bipaBullets.map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-gray-800">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[11px] font-semibold text-emerald-700">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-800">“We designed our business model around BIPA and GDPR compliance.”</div>
              <Link
                href="https://www.ilga.gov/Legislation/ILCS/Articles?ActID=3004&ChapterID=57"
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-black"
              >
                Read the Biometric Information Privacy Act (ILGA) →
              </Link>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="absolute left-3 top-3 z-10 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-900">Secure Identity Cloud</div>
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
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-600">What&apos;s covered</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-800">
                {whatCovered.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-900" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-600">What&apos;s not covered</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-800">
                {whatNotCovered.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-900" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-600">Consequences of non-compliance</p>
            <p className="text-base text-gray-700">
              Individuals have a private right of action with statutory damages ($1k negligent / $5k reckless per violation) plus attorneys’ fees, so every scan or transmission
              matters. Proper consent flows, clear policies, and strong security controls are required.
            </p>
            <p className="text-sm text-gray-600">Source: Illinois Biometric Information Privacy Act (BIPA). See the statute for full requirements and definitions.</p>
          </div>
        </div>
      </main>

      {sideOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" onClick={() => setSideOpen(false)} aria-hidden="true" />
          <div className="fixed top-0 right-0 z-50 h-full w-64 bg-white shadow-2xl ring-1 ring-black/10 transition">
            <div className="p-4 space-y-3 text-sm font-semibold text-gray-800 mt-12">
              <Link href="/" onClick={() => setSideOpen(false)} className="block rounded-md px-3 py-2 hover:bg-gray-100">
                Home
              </Link>
              <Link href="/pricing" onClick={() => setSideOpen(false)} className="block rounded-md px-3 py-2 hover:bg-gray-100">
                Pricing
              </Link>
              <Link href="/beta-waitlist" onClick={() => setSideOpen(false)} className="block rounded-md px-3 py-2 hover:bg-gray-100">
                Beta waitlist
              </Link>
              <Link href="/subscribe" onClick={() => setSideOpen(false)} className="block rounded-md px-3 py-2 hover:bg-gray-100">
                Get started
              </Link>
              <Link href="/bipa" onClick={() => setSideOpen(false)} className="block rounded-md px-3 py-2 hover:bg-gray-100">
                BIPA Trust &amp; Compliance
              </Link>
              <Link href="/newsroom" onClick={() => setSideOpen(false)} className="block rounded-md px-3 py-2 hover:bg-gray-100">
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

