"use client";

import { useState, useEffect } from "react";
import { AuthGate } from "@/components/AuthGate";

interface PWADiagnostics {
  installMode: string;
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  serviceWorker: {
    registered: boolean;
    state: string | null;
    scope: string | null;
    updateFound: boolean;
  };
  network: {
    online: boolean;
    effectiveType: string | null;
  };
  storage: {
    used: number;
    quota: number;
    usedMB: string;
    quotaMB: string;
    percentUsed: string;
  } | null;
  cacheVersion: string | null;
  lastSWUpdate: string | null;
  cacheKeys: string[];
}

export default function PWADiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<PWADiagnostics | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadDiagnostics = async () => {
      // Install Mode Detection
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const actualStandalone = isStandalone || isIOSStandalone;
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      let installMode = "Browser";
      if (actualStandalone) {
        installMode = "Standalone (Installed)";
      } else if (isIOS) {
        installMode = "iOS Safari";
      } else if (isAndroid) {
        installMode = "Android Browser";
      }

      // Service Worker Status
      let swData = {
        registered: false,
        state: null as string | null,
        scope: null as string | null,
        updateFound: false,
      };

      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            swData = {
              registered: true,
              state: registration.active?.state || null,
              scope: registration.scope,
              updateFound: !!registration.waiting,
            };
          }
        } catch (err) {
          console.error("SW check error:", err);
        }
      }

      // Network Status
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const networkData = {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
      };

      // Storage Estimate
      let storageData = null;
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;
          const usedMB = (used / 1024 / 1024).toFixed(2);
          const quotaMB = (quota / 1024 / 1024).toFixed(2);
          const percentUsed = quota > 0 ? ((used / quota) * 100).toFixed(1) : "0";
          
          storageData = {
            used,
            quota,
            usedMB,
            quotaMB,
            percentUsed,
          };
        } catch (err) {
          console.error("Storage estimate error:", err);
        }
      }

      // Cache Version & Last Update
      const cacheVersion = localStorage.getItem("pwa_cache_version") || "plusai-v1";
      const lastSWUpdate = localStorage.getItem("pwa_last_sw_update");

      // Cache Keys
      let cacheKeys: string[] = [];
      if ("caches" in window) {
        try {
          cacheKeys = await caches.keys();
        } catch (err) {
          console.error("Cache keys error:", err);
        }
      }

      setDiagnostics({
        installMode,
        isStandalone: actualStandalone,
        isIOS,
        isAndroid,
        serviceWorker: swData,
        network: networkData,
        storage: storageData,
        cacheVersion,
        lastSWUpdate,
        cacheKeys,
      });
    };

    loadDiagnostics();

    // Real-time network updates
    const handleOnline = () => loadDiagnostics();
    const handleOffline = () => loadDiagnostics();
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const copyDiagnostics = () => {
    if (!diagnostics) return;
    
    const jsonData = JSON.stringify(diagnostics, null, 2);
    navigator.clipboard.writeText(jsonData).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">PWA Diagnostics</h1>
            <p className="text-gray-400">Real-time Progressive Web App health metrics</p>
          </div>

          {!diagnostics ? (
            <div className="text-gray-400">Loading diagnostics...</div>
          ) : (
            <div className="space-y-6">
              {/* Install Status */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Install Status</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode:</span>
                    <span className="font-mono">{diagnostics.installMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Standalone:</span>
                    <span className={diagnostics.isStandalone ? "text-green-400" : "text-gray-400"}>
                      {diagnostics.isStandalone ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="font-mono">
                      {diagnostics.isIOS ? "iOS" : diagnostics.isAndroid ? "Android" : "Desktop/Other"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Worker */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Service Worker</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Registered:</span>
                    <span className={diagnostics.serviceWorker.registered ? "text-green-400" : "text-red-400"}>
                      {diagnostics.serviceWorker.registered ? "Yes" : "No"}
                    </span>
                  </div>
                  {diagnostics.serviceWorker.registered && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">State:</span>
                        <span className="font-mono">{diagnostics.serviceWorker.state || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Scope:</span>
                        <span className="font-mono text-xs">{diagnostics.serviceWorker.scope || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Update Available:</span>
                        <span className={diagnostics.serviceWorker.updateFound ? "text-yellow-400" : "text-gray-400"}>
                          {diagnostics.serviceWorker.updateFound ? "Yes" : "No"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Network */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Network</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={diagnostics.network.online ? "text-green-400" : "text-red-400"}>
                      {diagnostics.network.online ? "Online" : "Offline"}
                    </span>
                  </div>
                  {diagnostics.network.effectiveType && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connection Type:</span>
                      <span className="font-mono">{diagnostics.network.effectiveType}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Storage */}
              {diagnostics.storage && (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-xl font-semibold mb-4">Storage</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used:</span>
                      <span className="font-mono">{diagnostics.storage.usedMB} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quota:</span>
                      <span className="font-mono">{diagnostics.storage.quotaMB} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Usage:</span>
                      <span className="font-mono">{diagnostics.storage.percentUsed}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cache Info */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h2 className="text-xl font-semibold mb-4">Cache</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Version:</span>
                    <span className="font-mono">{diagnostics.cacheVersion}</span>
                  </div>
                  {diagnostics.lastSWUpdate && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Update:</span>
                      <span className="font-mono text-xs">{diagnostics.lastSWUpdate}</span>
                    </div>
                  )}
                  {diagnostics.cacheKeys.length > 0 && (
                    <div>
                      <span className="text-gray-400 block mb-2">Active Caches:</span>
                      <div className="space-y-1 pl-4">
                        {diagnostics.cacheKeys.map((key) => (
                          <div key={key} className="font-mono text-xs text-gray-300">{key}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={copyDiagnostics}
                className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                {copied ? "Copied!" : "Copy Diagnostics"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

