"use client";

import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export function MessagesIcon() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`/api/messages/threads?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          const total = data.threads.reduce(
            (sum: number, thread: any) => sum + (thread.unreadCount?.[currentUser.uid] || 0),
            0
          );
          setUnreadCount(total);
        } else {
          // Silently fail - don't show error to user
          setUnreadCount(0);
        }
      } catch (error) {
        // Silently fail
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const isActive = pathname?.startsWith('/messages');

  return (
    <Link
      href="/messages"
      className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      <Mail className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}

