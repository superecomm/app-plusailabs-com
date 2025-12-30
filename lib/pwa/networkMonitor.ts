"use client";

import { useState, useEffect } from "react";

/**
 * Hook for monitoring network online/offline status
 * Returns true if online, false if offline
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Network] Online');
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('network-online'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Network] Offline');
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('network-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Synchronous check for network status
 * Use this for one-off checks, prefer useNetworkStatus for reactive updates
 */
export function getNetworkStatus(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Get connection information (if available)
 * Returns connection type and effective speed
 */
export function getConnectionInfo(): {
  type: string | null;
  effectiveType: string | null;
  downlink: number | null;
  rtt: number | null;
} {
  if (typeof window === 'undefined') {
    return { type: null, effectiveType: null, downlink: null, rtt: null };
  }

  const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;

  if (!connection) {
    return { type: null, effectiveType: null, downlink: null, rtt: null };
  }

  return {
    type: connection.type || null,
    effectiveType: connection.effectiveType || null,
    downlink: connection.downlink || null,
    rtt: connection.rtt || null,
  };
}

/**
 * Check if connection is slow
 * Returns true if 2G or slow-2g
 */
export function isSlowConnection(): boolean {
  const { effectiveType } = getConnectionInfo();
  return effectiveType === '2g' || effectiveType === 'slow-2g';
}

/**
 * Listen for network status changes
 * Returns cleanup function
 */
export function onNetworkChange(
  callback: (isOnline: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

