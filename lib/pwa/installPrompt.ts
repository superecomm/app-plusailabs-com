// Install prompt utilities for PWA installation
// Handles beforeinstallprompt event and cooldown management

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

const COOLDOWN_KEY = 'pwa_install_dismissed';
const COOLDOWN_DAYS = 7;

/**
 * Initialize install prompt listener
 * Call this once on app mount
 */
export function initInstallPrompt(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar
    e.preventDefault();
    
    // Store event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Dispatch custom event so components can react
    window.dispatchEvent(new CustomEvent('pwa-installable'));
    
    console.log('[PWA] Install prompt available');
  });

  window.addEventListener('appinstalled', () => {
    // Clear deferred prompt
    deferredPrompt = null;
    
    // Clear any cooldown since app is now installed
    localStorage.removeItem(COOLDOWN_KEY);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('pwa-installed'));
    
    console.log('[PWA] App installed successfully');
  });
}

/**
 * Check if install prompt is available and not in cooldown
 */
export function isInstallable(): boolean {
  if (!deferredPrompt) return false;
  
  const dismissedAt = localStorage.getItem(COOLDOWN_KEY);
  if (!dismissedAt) return true;
  
  const dismissedTime = parseInt(dismissedAt, 10);
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  
  // Check if cooldown has expired
  if (now - dismissedTime > cooldownMs) {
    // Cooldown expired, clear it
    localStorage.removeItem(COOLDOWN_KEY);
    return true;
  }
  
  return false;
}

/**
 * Get the deferred install prompt
 */
export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/**
 * Trigger the install flow
 * Returns true if user accepted, false if dismissed
 */
export async function triggerInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.warn('[PWA] No install prompt available');
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;
    
    // Clear the deferred prompt
    deferredPrompt = null;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted install');
      return true;
    } else {
      console.log('[PWA] User dismissed install');
      return false;
    }
  } catch (error) {
    console.error('[PWA] Install prompt error:', error);
    return false;
  }
}

/**
 * Dismiss the install prompt and set cooldown
 */
export function dismissInstall(): void {
  // Set cooldown timestamp
  localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
  
  // Clear deferred prompt
  deferredPrompt = null;
  
  console.log(`[PWA] Install dismissed, cooldown set for ${COOLDOWN_DAYS} days`);
}

/**
 * Check if app is already installed (running in standalone mode)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for display-mode: standalone
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check for iOS standalone
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return isStandalone || isIOSStandalone;
}

/**
 * Get remaining cooldown time in days
 */
export function getCooldownDaysRemaining(): number | null {
  const dismissedAt = localStorage.getItem(COOLDOWN_KEY);
  if (!dismissedAt) return null;
  
  const dismissedTime = parseInt(dismissedAt, 10);
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const elapsed = now - dismissedTime;
  const remaining = cooldownMs - elapsed;
  
  if (remaining <= 0) return null;
  
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/**
 * Force clear the cooldown (for testing)
 */
export function clearCooldown(): void {
  localStorage.removeItem(COOLDOWN_KEY);
  console.log('[PWA] Install cooldown cleared');
}

