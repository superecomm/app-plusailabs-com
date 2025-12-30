/**
 * Web Vibration API for haptic feedback
 * Provides tactile feedback where supported
 */

/**
 * Check if vibration is supported
 */
export function isVibrationSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Light tap (button press, selection)
 */
export function hapticLight(): void {
  if (!isVibrationSupported()) return;
  
  try {
    navigator.vibrate(10);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Medium impact (send message, important action)
 */
export function hapticMedium(): void {
  if (!isVibrationSupported()) return;
  
  try {
    navigator.vibrate(20);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Heavy impact (error, critical action)
 */
export function hapticHeavy(): void {
  if (!isVibrationSupported()) return;
  
  try {
    navigator.vibrate(30);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Success pattern (completion, achievement)
 */
export function hapticSuccess(): void {
  if (!isVibrationSupported()) return;
  
  try {
    navigator.vibrate([10, 50, 10]);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Error pattern (failure, warning)
 */
export function hapticError(): void {
  if (!isVibrationSupported()) return;
  
  try {
    navigator.vibrate([30, 50, 30, 50, 30]);
  } catch (error) {
    // Silently fail
  }
}

/**
 * Custom vibration pattern
 */
export function hapticPattern(pattern: number[]): void {
  if (!isVibrationSupported()) return;
  
  try {
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail
  }
}

