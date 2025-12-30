"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, ArrowLeft, Edit2 } from "lucide-react";
import Link from "next/link";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, updateProfile as updateAuthProfile } from "firebase/auth";
import { ProfileMetrics } from "./ProfileMetrics";

export function IdentityHeader() {
  const { currentUser, userProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState("");
  const [editingHandle, setEditingHandle] = useState(false);
  const [handleText, setHandleText] = useState("");
  const [handleError, setHandleError] = useState("");
  const [handleChangeInfo, setHandleChangeInfo] = useState<{ canChange: boolean; daysRemaining: number }>({ canChange: true, daysRemaining: 0 });

  const displayName = userProfile?.displayName || currentUser?.displayName || "User";
  const email = currentUser?.email || "";
  const handle = userProfile?.handle || email.split('@')[0] || displayName.toLowerCase().replace(/\s+/g, '');

  // Load profile data
  useEffect(() => {
    if (userProfile?.coverPhotoURL) {
      setCoverImage(userProfile.coverPhotoURL);
    }
    if (userProfile?.bio) {
      setBioText(userProfile.bio);
    }
    setNameText(displayName);
    setHandleText(handle);
    
    // Check handle change eligibility
    if (userProfile?.handleChangeHistory && userProfile.handleChangeHistory.length > 0) {
      const lastChange = userProfile.handleChangeHistory[userProfile.handleChangeHistory.length - 1];
      let lastChangeDate: Date;
      
      if (lastChange.changedAt instanceof Date) {
        lastChangeDate = lastChange.changedAt;
      } else if (typeof lastChange.changedAt === 'object' && lastChange.changedAt !== null && 'toDate' in lastChange.changedAt) {
        lastChangeDate = (lastChange.changedAt as any).toDate();
      } else {
        lastChangeDate = new Date(lastChange.changedAt as any);
      }
      
      const daysSince = Math.floor((Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, 30 - daysSince);
      setHandleChangeInfo({
        canChange: daysSince >= 30,
        daysRemaining,
      });
    }
  }, [userProfile, displayName, handle]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !storage) return;

    try {
      setUploading(true);
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      const auth = getAuth();
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { photoURL });
      }
      
      window.location.reload();
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser || !storage) return;

    try {
      setUploadingCover(true);
      const storageRef = ref(storage, `covers/${currentUser.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const coverURL = await getDownloadURL(storageRef);
      setCoverImage(coverURL);
      
      // Save to Firestore user profile
      await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          coverPhotoURL: coverURL,
        }),
      });
    } catch (error) {
      console.error("Error uploading cover:", error);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveBio = async () => {
    if (!currentUser) return;

    try {
      await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          bio: bioText,
        }),
      });
      setEditingBio(false);
    } catch (error) {
      console.error("Error saving bio:", error);
    }
  };

  const handleSaveName = async () => {
    if (!currentUser || !nameText.trim()) return;

    try {
      const auth = getAuth();
      if (auth.currentUser) {
        await updateAuthProfile(auth.currentUser, { displayName: nameText });
      }
      
      await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          displayName: nameText,
        }),
      });
      setEditingName(false);
      window.location.reload();
    } catch (error) {
      console.error("Error saving name:", error);
    }
  };

  const handleSaveHandle = async () => {
    if (!currentUser || !handleText.trim()) return;
    
    setHandleError("");
    
    if (!handleChangeInfo.canChange) {
      setHandleError(`Can change again in ${handleChangeInfo.daysRemaining} days`);
      return;
    }

    // Validate format
    if (!/^[a-z0-9_-]{3,30}$/.test(handleText.toLowerCase())) {
      setHandleError("3-30 characters (letters, numbers, _, - only)");
      return;
    }

    try {
      const response = await fetch('/api/profile/change-handle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          newHandle: handleText.toLowerCase(),
        }),
      });

      if (response.ok) {
        setEditingHandle(false);
        window.location.reload();
      } else {
        const data = await response.json();
        setHandleError(data.error || 'Failed to change handle');
      }
    } catch (error) {
      console.error("Error saving handle:", error);
      setHandleError("Failed to save handle");
    }
  };

  return (
    <>
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-gray-900 dark:text-white rounded-md hover:bg-white dark:hover:bg-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Gradient Header (editable) */}
      <header 
        className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-cover bg-center"
        style={coverImage ? { backgroundImage: `url(${coverImage})` } : {}}
      >
        {/* Edit Cover Button */}
        <label className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-md cursor-pointer hover:bg-white dark:hover:bg-black transition-colors">
          <Camera className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            disabled={uploadingCover}
            className="hidden"
          />
        </label>
        
        {/* Profile Photo (smaller, overlaps) */}
        <div className="absolute -bottom-10 left-4">
          <div className="relative">
            {currentUser?.photoURL && !imageError ? (
              <img
                src={currentUser.photoURL}
                alt={displayName}
                className="w-20 h-20 rounded-full border-2 border-white dark:border-black object-cover bg-white"
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-white dark:border-black bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 w-6 h-6 bg-white dark:bg-gray-800 rounded-full border border-white dark:border-black flex items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Camera className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </header>
      
      {/* Identity Info (two-column layout) */}
      <div className="pt-12 px-4 pb-3 flex gap-6">
        {/* Left column: Identity */}
        <div className="flex-1">
          {/* Editable Display Name */}
        {editingName ? (
          <div className="flex items-center gap-2 mb-1">
            <input
              value={nameText}
              onChange={(e) => setNameText(e.target.value)}
              className="flex-1 px-2 py-1 text-lg font-bold border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Your name"
              autoFocus
            />
            <button
              onClick={handleSaveName}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingName(false);
                setNameText(displayName);
              }}
              className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{displayName}</h1>
            <button
              onClick={() => setEditingName(true)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Editable Handle */}
        {editingHandle ? (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">@</span>
              <input
                value={handleText}
                onChange={(e) => {
                  setHandleText(e.target.value);
                  setHandleError("");
                }}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                placeholder="yourhandle"
                autoFocus
              />
              <button
                onClick={handleSaveHandle}
                disabled={!handleChangeInfo.canChange}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingHandle(false);
                  setHandleText(handle);
                  setHandleError("");
                }}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded"
              >
                Cancel
              </button>
            </div>
            {handleError && (
              <p className="text-xs text-red-500 mt-1">{handleError}</p>
            )}
            {!handleChangeInfo.canChange && (
              <p className="text-xs text-yellow-600 mt-1">
                Can change again in {handleChangeInfo.daysRemaining} days
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">@{handle}</p>
            <button
              onClick={() => setEditingHandle(true)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title={handleChangeInfo.canChange ? "Change handle" : `Can change in ${handleChangeInfo.daysRemaining} days`}
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
        
        {/* Editable Bio */}
        {editingBio ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Add a bio..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveBio}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingBio(false);
                  setBioText(userProfile?.bio || "");
                }}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-1 flex items-start gap-2">
            {bioText ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{bioText}</p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">Add a bio...</p>
            )}
            <button
              onClick={() => setEditingBio(true)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
        </div>
        
        {/* Right column: Metrics */}
        <ProfileMetrics userId={currentUser?.uid || ''} isOwnProfile={true} />
      </div>
    </>
  );
}

