"use client";

import { useState, useEffect } from "react";
import { NeuralBox } from "@/components/viim/NeuralBox";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function LaunchScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Fade in effect on mount
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      {/* Blurred background effect */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-black transition-opacity duration-1000 ${
          showContent ? "opacity-100" : "opacity-0"
        }`} 
      />
      <div className="absolute inset-0 backdrop-blur-3xl" />

      {/* Main Content Container */}
      <div 
        className={`relative z-10 w-full max-w-2xl px-4 transition-all duration-1000 transform ${
          showContent ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Header / Brand */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">
            Plus AI
          </h1>
          <p className="text-gray-400 text-lg">
            Your secure, private AI companion
          </p>
        </div>

        {/* Neural Box Interface */}
        <div className="bg-black/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md h-[400px] md:h-[500px] flex flex-col">
          <NeuralBox 
            variant="assistant"
            showInputPanel={true}
            forcePromptVisible={true}
            className="flex-1"
            disableInteractions={false}
          />
        </div>

        {/* Footer Actions (Optional) */}
        {!currentUser && (
          <div className="mt-8 flex justify-center gap-4">
            <button 
              onClick={() => router.push("/pricing")}
              className="px-6 py-2.5 rounded-full bg-white text-black font-medium hover:bg-gray-100 transition-colors"
            >
              Sign In / Sign Up
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

