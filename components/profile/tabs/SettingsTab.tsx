"use client";

import { useState } from "react";
import { Fingerprint, Smartphone, Lock, Eye, Database, Code, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PrivacySettings } from "@/components/profile/PrivacySettings";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export function SettingsTab() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="p-4 space-y-2 max-w-4xl mx-auto">
      <Accordion>
        <AccordionItem title="My +AI">
          <div className="p-3 space-y-2">
            {/* Horizontal preference line */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Model:</span>
                <span className="font-medium">GPT-4o</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Agent:</span>
                <span className="font-medium">+Agent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Tone:</span>
                <span className="font-medium">Balanced</span>
              </div>
            </div>
            
            {/* Capabilities - compact toggles */}
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>Voice</span>
                <ToggleSwitch enabled={true} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <span>Memory</span>
                  <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 rounded">Soon</span>
                </div>
                <ToggleSwitch enabled={false} disabled />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Safety Mode</span>
                <ToggleSwitch enabled={true} />
              </div>
            </div>
          </div>
        </AccordionItem>
        
        <AccordionItem title="Voice Fingerprint">
          <div className="p-2 space-y-1">
            <Link 
              href="/viim/setup"
              className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Setup
            </Link>
            <Link 
              href="/viim/verify"
              className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Verify
            </Link>
            <Link 
              href="/voice-lock/read"
              className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Reading Session
            </Link>
          </div>
        </AccordionItem>
        
        <AccordionItem title="Devices">
          <div className="p-2 text-xs text-gray-600 dark:text-gray-400">
            No other devices.
          </div>
        </AccordionItem>
        
        <AccordionItem title="Security">
          <div className="p-3 space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Security settings coming soon
            </p>
          </div>
        </AccordionItem>
        
        <AccordionItem title="Notifications">
          <NotificationSettings />
        </AccordionItem>
        
        <AccordionItem title="Privacy">
          <PrivacySettings />
        </AccordionItem>
        
        <AccordionItem title="Datasets">
          <div className="p-2 text-xs text-gray-600 dark:text-gray-400">
            Manage datasets.
          </div>
        </AccordionItem>
        
        <AccordionItem title="Developer" badge="Dev">
          <div className="p-2 space-y-1">
            <Link 
              href="/dashboard"
              className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Dashboard
            </Link>
            <Link 
              href="/dev/pwa"
              className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              PWA Diagnostics
            </Link>
            <Link 
              href="/dev/revenue"
              className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              Revenue Metrics
            </Link>
          </div>
        </AccordionItem>
      </Accordion>
      
      {/* Sign Out - compact */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={handleSignOut}
          className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

interface AccordionItemProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  children: React.ReactNode;
}

function AccordionItem({ title, icon: Icon, badge, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
      
      {isOpen && (
        <div className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}

interface ToggleSwitchProps {
  enabled: boolean;
  disabled?: boolean;
}

function ToggleSwitch({ enabled, disabled }: ToggleSwitchProps) {
  return (
    <button
      className={`
        relative w-9 h-5 rounded-full transition-colors
        ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={disabled}
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

