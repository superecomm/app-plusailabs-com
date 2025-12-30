"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type UserAvatarProps = {
  onDeviceChange?: (deviceId?: string) => void;
};

export function UserAvatar({ onDeviceChange }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { currentUser } = useAuth();


  // Get user initials or use default
  const getInitials = () => {
    if (currentUser?.email) {
      return currentUser.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const getAvatarUrl = () => {
    return currentUser?.photoURL || null;
  };

  return (
    <Link 
      href="/profile"
      className="relative w-6 h-6 shrink-0 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-200 overflow-hidden"
      aria-label="Go to profile"
    >
      {getAvatarUrl() && !imageError ? (
        <img
          src={getAvatarUrl()!}
          alt="User avatar"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-[10px] font-medium text-gray-700">
          {getInitials()}
        </span>
      )}
    </Link>
  );
}

