"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { IdentityHeader } from "@/components/profile/IdentityHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileTab } from "@/components/profile/tabs/ProfileTab";
import { VaultTab } from "@/components/profile/tabs/VaultTab";
import { ActivityTab } from "@/components/profile/tabs/ActivityTab";
import { SettingsTab } from "@/components/profile/tabs/SettingsTab";
import { ContentGrid } from "@/components/profile/ContentGrid";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Profile');

  return (
    <AuthGate>
      <div className="min-h-screen bg-white dark:bg-black" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Identity Header */}
        <IdentityHeader />
        
        {/* Sticky Tabs */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Tab Content Area */}
        <div>
          {activeTab === 'Profile' && (
            <>
              <ProfileTab />
              <ContentGrid />
            </>
          )}
          {activeTab === 'Cloud' && <VaultTab />}
          {activeTab === 'Activity' && <ActivityTab />}
          {activeTab === 'Settings' && <SettingsTab />}
        </div>
      </div>
    </AuthGate>
  );
}
