"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  requestNotificationPermission, 
  subscribeToPush, 
  unsubscribeFromPush,
  areNotificationsSupported,
  getNotificationPermission 
} from "@/lib/notifications/webPush";

export function NotificationSettings() {
  const { currentUser } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (areNotificationsSupported()) {
      setPermission(getNotificationPermission());
    }
  }, []);

  const handleEnable = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Subscribe to push
        const subscription = await subscribeToPush();
        
        if (subscription) {
          // Save subscription to backend
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.uid,
              subscription,
            }),
          });
          
          setSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await unsubscribeFromPush();
      
      // Remove subscription from backend
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.uid }),
      });
      
      setSubscribed(false);
    } catch (error) {
      console.error('Error disabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!areNotificationsSupported()) {
    return (
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
        Notifications not supported in this browser
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Push Notifications</p>
          <p className="text-xs text-gray-500">Get notified when responses are ready</p>
        </div>
        <ToggleSwitch
          enabled={subscribed && permission === 'granted'}
          onChange={(value) => {
            if (value) {
              handleEnable();
            } else {
              handleDisable();
            }
          }}
          disabled={loading}
        />
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-red-500">
          Notifications blocked. Enable in browser settings.
        </p>
      )}

      {permission === 'granted' && subscribed && (
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>✓ Response ready alerts</p>
          <p>✓ Security alerts</p>
          <p>✓ Feature announcements</p>
        </div>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, onChange, disabled }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`
        relative w-9 h-5 rounded-full transition-colors
        ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform
          ${enabled ? 'translate-x-4' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

