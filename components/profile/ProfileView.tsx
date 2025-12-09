"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Settings, Smartphone, Shield, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProfileView() {
  const { userProfile, userPreferences, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "devices" | "security">("general");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-gray-900 to-gray-800"></div>
          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4 flex justify-between">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-4xl font-bold text-gray-500 shadow-md">
                {userProfile?.photoURL ? (
                  <img src={userProfile.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  (userProfile?.displayName?.[0] || userProfile?.email?.[0] || "U").toUpperCase()
                )}
              </div>
              <div className="mt-16">
                 <button 
                   onClick={handleLogout}
                   className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                 >
                   <LogOut className="h-4 w-4" />
                   Sign out
                 </button>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userProfile?.displayName || "User"}</h1>
              <p className="text-sm text-gray-500">{userProfile?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 rounded-xl bg-white p-1 shadow-sm">
            <button
                onClick={() => setActiveTab("general")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                    activeTab === "general" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
            >
                <Settings className="h-4 w-4" />
                General
            </button>
            <button
                onClick={() => setActiveTab("devices")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                    activeTab === "devices" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
            >
                <Smartphone className="h-4 w-4" />
                Devices
            </button>
            <button
                onClick={() => setActiveTab("security")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
                    activeTab === "security" ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
            >
                <Shield className="h-4 w-4" />
                Security
            </button>
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
           {activeTab === "general" && (
               <div className="space-y-6">
                   <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
                   <div className="grid gap-4">
                       <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                           <div>
                               <p className="font-medium text-gray-900">Appearance</p>
                               <p className="text-sm text-gray-500">Manage theme settings</p>
                           </div>
                           <span className="text-sm text-gray-600 capitalize">{userPreferences?.theme || "System"}</span>
                       </div>
                       <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                           <div>
                               <p className="font-medium text-gray-900">Default Model</p>
                               <p className="text-sm text-gray-500">Preferred AI model</p>
                           </div>
                           <span className="text-sm text-gray-600">{userPreferences?.defaultModel || "GPT-4o"}</span>
                       </div>
                   </div>
               </div>
           )}

           {activeTab === "devices" && (
               <div className="space-y-6">
                   <h2 className="text-lg font-semibold text-gray-900">Active Devices</h2>
                   <p className="text-sm text-gray-500">Manage devices connected to your account.</p>
                   {/* TODO: List devices from Firestore */}
                   <div className="rounded-lg border border-gray-100 p-4 text-center text-gray-500">
                       No other devices detected.
                   </div>
               </div>
           )}

           {activeTab === "security" && (
               <div className="space-y-6">
                   <h2 className="text-lg font-semibold text-gray-900">Security & Privacy</h2>
                   
                   <div className="space-y-4">
                       <div className="rounded-lg border border-gray-100 p-4">
                           <div className="flex items-center justify-between">
                               <div>
                                   <p className="font-medium text-gray-900">Voice Fingerprint</p>
                                   <p className="text-sm text-gray-500">Biometric authentication</p>
                               </div>
                               <button className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white">
                                   Manage
                               </button>
                           </div>
                       </div>
                       
                       <div className="rounded-lg border border-gray-100 p-4">
                           <div className="flex items-center justify-between">
                               <div>
                                   <p className="font-medium text-gray-900">Data Retention</p>
                                   <p className="text-sm text-gray-500">Control how long your data is stored</p>
                               </div>
                               <button className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                                   Settings
                               </button>
                           </div>
                       </div>
                   </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
}

