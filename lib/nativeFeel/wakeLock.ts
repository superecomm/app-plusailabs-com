/**
 * Wake Lock API to keep screen awake during long sessions
 */

let wakeLock: WakeLockSentinel | null = null;

/**
 * Check if Wake Lock is supported
 */
export function isWakeLockSupported(): boolean {
  return 'wakeLock' in navigator;
}

/**
 * Request wake lock to keep screen awake
 */
export async function requestWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) {
    console.warn('Wake Lock API not supported');
    return false;
  }

  try {
    wakeLock = await (navigator as any).wakeLock.request('screen');
    
    if (wakeLock) {
      wakeLock.addEventListener('release', () => {
        console.log('[WakeLock] Released');
      });
      
      console.log('[WakeLock] Activated');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[WakeLock] Request failed:', error);
    return false;
  }
}

/**
 * Release wake lock
 */
export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log('[WakeLock] Released manually');
    } catch (error) {
      console.error('[WakeLock] Release failed:', error);
    }
  }
}

/**
 * Check if wake lock is currently active
 */
export function isWakeLockActive(): boolean {
  return wakeLock !== null && !wakeLock.released;
}

/**
 * Re-request wake lock on visibility change
 * Useful because wake lock is automatically released when page is hidden
 */
export function setupWakeLockReacquisition(): () => void {
  if (!isWakeLockSupported()) {
    return () => {};
  }

  const handleVisibilityChange = async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
      await requestWakeLock();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

