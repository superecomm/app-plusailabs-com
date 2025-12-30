"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { UserProfile } from "@/lib/data/types";
import type { ContentItem } from "@/types/content";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const response = await fetch(`/api/profile/public/${handle}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setContent(data.content || []);
        } else if (response.status === 404) {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching public profile:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Profile not found</p>
          <Link href="/" className="text-blue-600 text-sm">
            ← Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-20">
        <Link
          href="/"
          className="flex items-center justify-center w-8 h-8 bg-white/90 dark:bg-black/90 backdrop-blur-sm text-gray-900 dark:text-white rounded-md hover:bg-white dark:hover:bg-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>

      {/* Header */}
      <header 
        className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-cover bg-center"
        style={profile.coverPhotoURL ? { backgroundImage: `url(${profile.coverPhotoURL})` } : {}}
      >
        <div className="absolute -bottom-10 left-4">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-20 h-20 rounded-full border-2 border-white dark:border-black object-cover bg-white"
            />
          ) : (
            <div className="w-20 h-20 rounded-full border-2 border-white dark:border-black bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
              {profile.displayName?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Profile Info */}
      <div className="pt-12 px-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.displayName}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">@{handle}</p>
            {profile.bio && (
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link
              href={`/?invoke=+${handle}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Link>
            <Link
              href={`/messages/new?to=${handle}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Message
            </Link>
          </div>
        </div>

        {/* Stats (if public) */}
        {profile.publicFields?.showStats && profile.stats && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {profile.stats.conversations !== undefined && (
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-center">
                <p className="text-xl font-bold">{profile.stats.conversations}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Chats</p>
              </div>
            )}
            {profile.stats.posts !== undefined && (
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-center">
                <p className="text-xl font-bold">{profile.stats.posts}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Posts</p>
              </div>
            )}
            {profile.stats.saved !== undefined && (
              <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-center">
                <p className="text-xl font-bold">{profile.stats.saved}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Saved</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Public Content (if enabled) */}
      {profile.publicFields?.showContent && content.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Posts</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {content.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700"
              >
                <h4 className="text-sm font-semibold line-clamp-2">{item.title}</h4>
                {item.body && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                    {item.body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {profile.publicFields?.showContent && content.length === 0 && (
        <div className="px-4 pb-4 text-center">
          <p className="text-sm text-gray-500">No public posts yet</p>
        </div>
      )}
    </div>
  );
}

