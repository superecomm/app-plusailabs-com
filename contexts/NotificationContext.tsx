"use client";

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { NotificationPill } from "@/components/ui/NotificationPill";

export type NotificationType = "error" | "warning" | "limit" | "success" | "info";

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  actions?: NotificationAction[];
  duration?: number;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, message: string, actions?: NotificationAction[], duration?: number) => void;
  dismissNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const showNotification = useCallback(
    (type: NotificationType, message: string, actions?: NotificationAction[], duration = 7000) => {
      const id = Date.now().toString();
      setActiveNotification({ id, type, message, actions, duration });
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
      <div className="relative h-full flex flex-col">
        <div className="absolute top-14 left-0 right-0 z-50 flex justify-center pointer-events-none px-4">
          {activeNotification && (
            <NotificationPill
              key={activeNotification.id}
              type={activeNotification.type}
              message={activeNotification.message}
              actions={activeNotification.actions}
              onDismiss={dismissNotification}
              duration={activeNotification.duration}
            />
          )}
        </div>
        {children}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

