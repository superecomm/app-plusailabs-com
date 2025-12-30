"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function PrivacySettings() {
  const { currentUser } = useAuth();
  const [isPublic, setIsPublic] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/profile/privacy?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setIsPublic(data.isPublic || false);
          setShowStats(data.publicFields?.showStats || false);
          setShowContent(data.publicFields?.showContent || false);
        }
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
      }
    };

    fetchSettings();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          isPublic,
          publicFields: {
            showStats,
            showContent,
          },
        }),
      });
    } catch (error) {
      console.error("Error saving privacy settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Public Profile</p>
          <p className="text-xs text-gray-500">Make your profile discoverable</p>
        </div>
        <ToggleSwitch
          enabled={isPublic}
          onChange={(value) => {
            setIsPublic(value);
            handleSave();
          }}
        />
      </div>

      {isPublic && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm">Show Stats</p>
            <ToggleSwitch
              enabled={showStats}
              onChange={(value) => {
                setShowStats(value);
                handleSave();
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm">Show Public Content</p>
            <ToggleSwitch
              enabled={showContent}
              onChange={(value) => {
                setShowContent(value);
                handleSave();
              }}
            />
          </div>
        </>
      )}

      {isPublic && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          <Link
            href={`/u/${currentUser?.email?.split('@')[0]}`}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            View public profile →
          </Link>
        </div>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSwitch({ enabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative w-9 h-5 rounded-full transition-colors
        ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}
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

