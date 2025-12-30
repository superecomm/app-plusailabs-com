"use client";

import { Bookmark, Share as ShareIcon, Edit, Eye } from "lucide-react";
import type { ContentItem } from "@/types/content";
import { formatDistanceToNow } from "date-fns";

interface ContentCardProps {
  data: ContentItem;
}

export function ContentCard({ data }: ContentCardProps) {
  switch (data.type) {
    case 'post':
      return <PostCard data={data} />;
    case 'saved':
      return <SavedCard data={data} />;
    case 'image':
    case 'video':
    case 'gallery':
      return <MediaCard data={data} />;
    case 'product':
      return <ProductCard data={data} />;
    default:
      return null;
  }
}

function ProductCard({ data }: { data: ContentItem }) {
  if (!data.product) return null;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
      {data.media?.items[0] && (
        <img
          src={data.media.items[0].thumbnail || data.media.items[0].url}
          alt={data.title}
          className="w-full aspect-square object-cover rounded mb-2"
        />
      )}
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
        {data.title}
      </h4>
      <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        ${data.product.price}
      </p>
      <div className="flex gap-1.5">
        <ActionButton>Buy</ActionButton>
        <ActionButton>Save</ActionButton>
      </div>
    </div>
  );
}

function PostCard({ data }: { data: ContentItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1.5">
        {data.title}
      </h4>
      {data.body && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {data.body}
        </p>
      )}
      {data.tags && data.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {data.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5 mt-2">
        <ActionButton>Share</ActionButton>
        <ActionButton>Edit</ActionButton>
      </div>
    </div>
  );
}

function SavedCard({ data }: { data: ContentItem }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Bookmark className="w-3 h-3 text-blue-600" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Saved</span>
      </div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
        {data.title}
      </h4>
      <div className="flex gap-1.5">
        <ActionButton>View</ActionButton>
        {data.visibility === 'private' && (
          <ActionButton>Post</ActionButton>
        )}
      </div>
    </div>
  );
}

function MediaCard({ data }: { data: ContentItem }) {
  const firstMedia = data.media?.items?.[0];
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
      {firstMedia && (
        <img
          src={firstMedia.thumbnail || firstMedia.url}
          alt={data.title}
          className="w-full aspect-square object-cover"
        />
      )}
      <div className="p-2">
        <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-1 mb-1.5">
          {data.title}
        </p>
        <div className="flex gap-1">
          <ActionButton>View</ActionButton>
          <ActionButton>Share</ActionButton>
        </div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
}

function ActionButton({ children, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
    >
      {children}
    </button>
  );
}

