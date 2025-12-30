/**
 * Handle validation and change tracking
 */

export interface HandleChangeRecord {
  oldHandle: string;
  newHandle: string;
  changedAt: Date;
}

/**
 * Validate handle format
 */
export function isValidHandle(handle: string): boolean {
  // Must be 3-30 characters, alphanumeric + underscore/dash
  const regex = /^[a-z0-9_-]{3,30}$/;
  return regex.test(handle.toLowerCase());
}

/**
 * Check if handle is available
 */
export async function isHandleAvailable(handle: string, currentUserId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/profile/check-handle?handle=${encodeURIComponent(handle)}&userId=${currentUserId}`);
    if (response.ok) {
      const data = await response.json();
      return data.available;
    }
    return false;
  } catch (error) {
    console.error('Error checking handle:', error);
    return false;
  }
}

/**
 * Check if user can change handle (30-day limit)
 */
export function canChangeHandle(lastChangeDate: Date | null): {
  canChange: boolean;
  daysRemaining: number;
} {
  if (!lastChangeDate) {
    return { canChange: true, daysRemaining: 0 };
  }

  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 30 - daysSinceChange);

  return {
    canChange: daysSinceChange >= 30,
    daysRemaining,
  };
}

/**
 * Format handle (lowercase, remove invalid chars)
 */
export function formatHandle(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 30);
}

