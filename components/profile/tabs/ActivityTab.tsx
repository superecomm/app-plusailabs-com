"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function ActivityTab() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, saved: 0, verifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/profile/stats?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser]);

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Stats Row - compact, real data */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Chats" value={loading ? 0 : stats.conversations} />
        <StatCard label="Saved" value={loading ? 0 : stats.saved} />
        <StatCard label="Verified" value={loading ? 0 : stats.verifications} />
      </div>
      
      {/* Recent Activity - minimal */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recent</h3>
        <div className="space-y-1.5">
          <ActivityItem 
            title="React patterns" 
            time="2h"
          />
          <ActivityItem 
            title="Birthday party plan" 
            time="1d"
          />
          <ActivityItem 
            title="family-photo.jpg" 
            time="3d"
          />
        </div>
      </div>
      
      {/* Link */}
      <Link 
        href="/chat-sessions"
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex"
      >
        View all →
      </Link>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md text-center">
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  time: string;
}

function ActivityItem({ title, time }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer">
      <p className="text-sm text-gray-900 dark:text-white truncate">{title}</p>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{time}</span>
    </div>
  );
}

