/**
 * Web Push Notifications for PWA
 * Uses FCM for cross-platform support
 */

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Subscribe to push notifications
 * Returns subscription data to save to backend
 */
export async function subscribeToPush(): Promise<PushSubscriptionData | null> {
  if (!areNotificationsSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    if (!vapidKey) {
      console.warn('VAPID public key not configured');
      return null;
    }
    
    // Subscribe to push
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });

    // Convert to storable format
    const subscriptionData = subscription.toJSON();
    
    if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
      return null;
    }
    
    return {
      endpoint: subscriptionData.endpoint,
      keys: {
        p256dh: subscriptionData.keys.p256dh,
        auth: subscriptionData.keys.auth,
      },
    };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

/**
 * Show a local notification (doesn't require push)
 */
export async function showLocalNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!areNotificationsSupported()) return;
  
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, options);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

