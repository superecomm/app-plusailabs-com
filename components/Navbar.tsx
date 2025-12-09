"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"chat" | "explore">("chat");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <nav className="border-b border-[#E5E7EB] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <div className="flex-1">
            <Link href="/" className="text-xl font-bold text-[#111111]">
              VoiceLock™ by Super Plus AI
            </Link>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-1 text-sm font-semibold text-gray-700 shadow-sm">
              <button
                onClick={() => setMode("chat")}
                className={`px-4 py-1.5 rounded-full transition ${
                  mode === "chat"
                    ? "bg-[#111111] text-white shadow"
                    : "text-gray-700 hover:text-black"
                }`}
                type="button"
                aria-pressed={mode === "chat"}
              >
                Chat
              </button>
              <button
                onClick={() => setMode("explore")}
                className={`px-4 py-1.5 rounded-full transition ${
                  mode === "explore"
                    ? "bg-[#111111] text-white shadow"
                    : "text-gray-700 hover:text-black"
                }`}
                type="button"
                aria-pressed={mode === "explore"}
              >
                Explore
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-4">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-[#111111] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/voice-lock/setup"
                  className="text-slate-600 hover:text-[#111111] transition-colors"
                >
                  Setup
                </Link>
                <Link
                  href="/voice-lock/verify"
                  className="text-slate-600 hover:text-[#111111] transition-colors"
                >
                  Verify
                </Link>
                <span className="text-slate-500 text-sm">{currentUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/"
                className="px-4 py-2 bg-[#111111] text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Log in / Sign up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

