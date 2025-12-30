"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { TrendingUp, Package, Video, Users } from "lucide-react";
import type { ContentItem } from "@/types/content";
import { BuyCard } from "@/components/commerce/BuyCard";
import Link from "next/link";

type FeedFilter = 'for-you' | 'products' | 'videos' | 'creators' | 'trending';

export default function ExplorePage() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('for-you');
  const [feed, setFeed] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [filter]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/explore/feed?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setFeed(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="max-w-5xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Explore
            </h1>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <FilterTab
                active={filter === 'for-you'}
                onClick={() => setFilter('for-you')}
              >
                For You
              </FilterTab>
              
              <FilterTab
                active={filter === 'products'}
                onClick={() => setFilter('products')}
                icon={Package}
              >
                Products
              </FilterTab>
              
              <FilterTab
                active={filter === 'videos'}
                onClick={() => setFilter('videos')}
                icon={Video}
              >
                Videos
              </FilterTab>
              
              <FilterTab
                active={filter === 'creators'}
                onClick={() => setFilter('creators')}
                icon={Users}
              >
                Creators
              </FilterTab>
              
              <FilterTab
                active={filter === 'trending'}
                onClick={() => setFilter('trending')}
                icon={TrendingUp}
              >
                Trending
              </FilterTab>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No content yet in this category
              </p>
              <Link
                href="/create"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Be the first to post →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {feed.map((item) => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

interface FilterTabProps {
  active: boolean;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function FilterTab({ active, onClick, icon: Icon, children }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

function FeedCard({ item }: { item: ContentItem }) {
  switch (item.type) {
    case 'product':
      return <BuyCard product={item} compact />;
    
    case 'video':
    case 'image':
    case 'gallery':
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          {item.media?.items[0] && (
            <img
              src={item.media.items[0].thumbnail || item.media.items[0].url}
              alt={item.title}
              className="w-full aspect-square object-cover"
            />
          )}
          <div className="p-3">
            <h4 className="font-semibold text-sm line-clamp-2">{item.title}</h4>
            <p className="text-xs text-gray-500 mt-1">@{item.ownerId}</p>
          </div>
        </div>
      );
    
    default:
      return null;
  }
}

