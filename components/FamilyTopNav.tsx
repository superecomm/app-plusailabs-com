"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import plusAi from "@/assets/plusailabs brand assets/plusai-full-logo-black.png";

export function FamilyTopNav() {
  const [sideOpen, setSideOpen] = useState(false);

  return (
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
    </header>
  );
}

