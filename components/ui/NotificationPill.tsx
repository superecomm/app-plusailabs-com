"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Info, AlertOctagon, CheckCircle } from "lucide-react";
import type { NotificationType, NotificationAction } from "@/contexts/NotificationContext";

interface NotificationPillProps {
  type: NotificationType;
  message: string;
  actions?: NotificationAction[];
  onDismiss: () => void;
  duration?: number;
}

export function NotificationPill({ type, message, actions, onDismiss, duration = 7000 }: NotificationPillProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay to trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Wait for exit animation to finish before unmounting
        setTimeout(onDismiss, 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "error":
      case "limit":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      case "warning":
        return <AlertOctagon className="h-3.5 w-3.5 text-orange-600" />;
      case "success":
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />;
      case "info":
      default:
        return <Info className="h-3.5 w-3.5 text-blue-600" />;
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-full border border-gray-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur transition-all duration-300 ease-out max-w-full sm:max-w-xl ${
        isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95"
      }`}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      
      <p className="text-xs font-medium text-gray-700 truncate min-w-0 flex-1">
        {message}
      </p>

      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 ml-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleDismiss}
        className="ml-1 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

