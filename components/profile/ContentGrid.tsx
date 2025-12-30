"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import type { ContentItem, ContentFilter } from "@/types/content";
import { ContentCard } from "./ContentCard";

const filters: ContentFilter[] = ['All', 'Posts', 'Saved', 'Media'];

export function ContentGrid() {
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<ContentFilter>('All');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchContent();
    }
  }, [currentUser, filter]);

  const fetchContent = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/content/list?filter=${filter.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - compact */}
        <div className="mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Content</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Saved & shared items
          </p>
        </div>
        
        {/* Filter Chips - box shaped */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${
                  filter === f
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
        
        {/* Grid - compact */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse" />
            ))}
          </div>
        ) : content.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {content.map((item) => (
              <ContentCard key={item.id} data={item} />
            ))}
          </div>
        ) : (
          <EmptyState filter={filter} />
        )}
        
        {/* New Post - compact, neural box style */}
        <Link
          href="/create"
          className="mt-3 w-full py-2.5 px-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-medium transition-colors text-center block"
        >
          + New Post
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: ContentFilter }) {
  const getMessage = () => {
    switch (filter) {
      case 'Posts':
        return 'No posts yet';
      case 'Saved':
        return 'No saved items';
      case 'Media':
        return 'No media';
      default:
        return 'No content yet';
    }
  };

  return (
    <div className="text-center py-8">
      <p className="text-xs text-gray-500 dark:text-gray-400">{getMessage()}</p>
    </div>
  );
}

