"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Share, X } from "lucide-react";
import plusAiIcon from "@/assets/plusailabs brand assets/plusai-icon-color-336x295.png";

const IOS_HELPER_KEY = 'pwa_ios_helper_dismissed';

function detectIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = (window.navigator as any).standalone === true;
  const isSafari = !navigator.userAgent.includes('CriOS') && 
                   !navigator.userAgent.includes('FxiOS') &&
                   !navigator.userAgent.includes('EdgiOS');
  
  return isIOS && !isInStandaloneMode && isSafari;
}

export function IOSInstallHelper() {
  const [show, setShow] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check if we should show the helper
    const dismissed = localStorage.getItem(IOS_HELPER_KEY);
    const isIOSSafari = detectIOSSafari();
    
    if (!dismissed && isIOSSafari) {
      // Small delay to avoid showing immediately
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(IOS_HELPER_KEY, 'true');
    }
    setShow(false);
  };

  // Don't render on server or before mounted
  if (!mounted || !show) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in overflow-hidden"
        onClick={handleDismiss}
      />
      
      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto bg-gray-900 rounded-2xl p-6 z-50 animate-slide-up border border-gray-800 overflow-y-auto max-h-[90vh]">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center p-2">
            <Image 
              src={plusAiIcon} 
              alt="+AI Icon" 
              width={64} 
              height={64}
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-white">
            Install +AI
          </h2>

          <p className="text-gray-300 text-sm">
            Add +AI to your home screen for the best experience
          </p>

          {/* Instructions */}
          <div className="bg-black/50 rounded-lg p-4 space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-white">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  Tap the <Share className="inline w-4 h-4 mx-1" /> <span className="font-semibold">Share</span> button below
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-white">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  Scroll and tap <span className="font-semibold">"Add to Home Screen"</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-white">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-300">
                  Tap <span className="font-semibold">"Add"</span> to confirm
                </p>
              </div>
            </div>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-white focus:ring-2 focus:ring-white"
            />
            <span className="text-sm text-gray-400">Don't show this again</span>
          </label>

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}

