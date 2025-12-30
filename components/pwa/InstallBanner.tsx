"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { isInstallable, triggerInstall, dismissInstall, isAppInstalled } from "@/lib/pwa/installPrompt";

export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Don't show if already installed
    if (isAppInstalled()) {
      return;
    }

    // Check if installable
    const checkInstallable = () => {
      if (isInstallable()) {
        setShow(true);
      }
    };

    // Check immediately
    checkInstallable();

    // Listen for installable event
    const handleInstallable = () => {
      if (isInstallable()) {
        setShow(true);
      }
    };

    const handleInstalled = () => {
      setShow(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [mounted]);

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await triggerInstall();
    setInstalling(false);
    
    if (accepted) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    dismissInstall();
    setShow(false);
  };

  // Don't render on server or before mounted
  if (!mounted || !show) return null;

  return (
    <div className="w-full bg-gray-800 border-b border-gray-700 flex-shrink-0">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Install +AI</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="px-3 py-1 bg-white text-black rounded text-xs font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {installing ? "Installing..." : "Install"}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1 text-gray-300 text-xs hover:text-white transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

