"use client";

import Link from "next/link";
import Image from "next/image";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image src={plusAi} alt="+AI Labs" width={80} height={24} className="h-5 w-auto" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-gray-900">+AI Labs</p>
            <p className="text-xs text-gray-500">Secure, multimodal AI for everyone.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <Link href="/pricing" className="hover:text-gray-900 transition">
            Pricing
          </Link>
          <Link href="/family" className="hover:text-gray-900 transition">
            Family Plan
          </Link>
          <Link href="/newsroom" className="hover:text-gray-900 transition">
            Newsroom
          </Link>
          <Link href="/about" className="hover:text-gray-900 transition">
            About +AI Labs
          </Link>
          <Link href="/subscribe" className="hover:text-gray-900 transition">
            Get started
          </Link>
          <a href="mailto:hello@plusailabs.com" className="hover:text-gray-900 transition">
            Contact
          </a>
        </div>
        <div className="text-xs text-gray-500">
          © {new Date().getFullYear()} PlusAI Labs. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

