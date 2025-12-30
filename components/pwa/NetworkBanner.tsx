"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkBanner() {
  const [mounted, setMounted] = useState(false);
  const [showOffline, setShowOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const isOnline = navigator.onLine;

    
    if (!isOnline) {
      setShowOffline(true);
      setShowReconnected(false);
    } else if (showOffline && isOnline) {
      // Show reconnected message
      setShowOffline(false);
      setShowReconnected(true);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowOffline(false);
    }

    const handleOnline = () => {
      if (showOffline) {
        setShowOffline(false);
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setShowOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mounted, showOffline]);

  // Explicit: don't render anything if not mounted or nothing to show
  if (!mounted) return null;
  if (!showOffline && !showReconnected) return null;

  // Show offline banner
  if (showOffline) {
    return (
      <div className="w-full bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="px-3 py-1.5">
          <div className="flex items-center justify-center gap-2 text-xs">
            <WifiOff className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-300">
              Offline — messages queued
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show reconnected banner (temporary)
  if (showReconnected) {
    return (
      <div className="w-full bg-green-900/20 border-b border-green-500/30 flex-shrink-0">
        <div className="px-3 py-1.5">
          <div className="flex items-center justify-center gap-2 text-xs">
            <Wifi className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-300">
              Reconnected
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

