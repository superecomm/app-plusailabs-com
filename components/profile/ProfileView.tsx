"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User, Settings, Smartphone, Shield, LogOut, Camera, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, updateProfile } from "firebase/auth";

export function ProfileView() {
  const { userProfile, userPreferences, logout, currentUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "devices" | "security">("general");
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !storage) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Update Firebase Auth profile
      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }
      
      // Refresh page to show new photo
      window.location.reload();
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!currentUser) return;
    
    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
        setEditingName(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4 flex justify-between">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-4xl font-bold text-gray-500 shadow-md">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (userProfile?.displayName?.[0] || userProfile?.email?.[0] || "U").toUpperCase()
                  )}
                </div>
                {/* Photo upload button */}
                <label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors">
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  </div>
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
            <div className="flex items-center gap-3">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Your name"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdateName}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setDisplayName(userProfile?.displayName || "");
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{userProfile?.displayName || "User"}</h1>
                  <button
                    onClick={() => {
                      setEditingName(true);
                      setDisplayName(userProfile?.displayName || "");
                    }}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{userProfile?.email}</p>
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

