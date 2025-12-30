"use client";

import { useState, useEffect } from "react";
import { Plus, Bookmark } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface ProfileMetricsProps {
  userId: string;
  isOwnProfile?: boolean;
}

export function ProfileMetrics({ userId, isOwnProfile = false }: ProfileMetricsProps) {
  const { currentUser } = useAuth();
  const [metrics, setMetrics] = useState({
    vibes: 0,
    posts: 0,
    saves: 0,
    views: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [userId]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/profile/metrics?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesToSelf = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/messages/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId1: currentUser.uid,
          userId2: currentUser.uid,
          user1Data: {
            handle: currentUser.email?.split('@')[0],
            displayName: currentUser.displayName || 'You',
            photoURL: currentUser.photoURL,
          },
          user2Data: {
            handle: currentUser.email?.split('@')[0],
            displayName: currentUser.displayName || 'You',
            photoURL: currentUser.photoURL,
          },
        }),
      });

      if (response.ok) {
        const { threadId } = await response.json();
        window.location.href = `/messages/${threadId}`;
      }
    } catch (error) {
      console.error('Error creating notes thread:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 h-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Metrics - Horizontal Layout */}
      <div className="flex gap-4">
        <div className="flex-1 text-center py-2">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            +{metrics.vibes}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Vibes</div>
        </div>
        
        <div className="flex-1 text-center py-2">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{metrics.posts}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Posts</div>
        </div>
        
        <div className="flex-1 text-center py-2">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{metrics.saves}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Saves</div>
        </div>
        
        <div className="flex-1 text-center py-2">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{metrics.views}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
        </div>
      </div>

      {/* Action buttons (only on own profile) */}
      {isOwnProfile && (
        <div className="space-y-1.5 pt-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            New chat
          </Link>
          
          <button
            onClick={handleNotesToSelf}
            className="flex items-center justify-center gap-1.5 w-full px-2 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium transition-colors"
          >
            <Bookmark className="w-3 h-3" />
            Notes
          </button>
        </div>
      )}
    </div>
  );
}

