"use client";

import { MessageSquare, ShoppingCart, Bookmark } from "lucide-react";
import type { ContentItem } from "@/types/content";

interface InlineProductCardProps {
  product: ContentItem;
  onAskAI?: () => void;
}

export function InlineProductCard({ product, onAskAI }: InlineProductCardProps) {
  if (!product.product) return null;

  const handleBuy = () => {
    if (product.product?.affiliate?.url) {
      window.open(product.product.affiliate.url, '_blank');
    }
  };

  const isDeal = product.product.compareAt && product.product.compareAt > product.product.price;

  return (
    <div className="my-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 max-w-sm">
      {/* Image/Video */}
      {product.media?.items[0] && (
        <div className="relative mb-3">
          {product.media.items[0].type === 'video' ? (
            <img
              src={product.media.items[0].thumbnail || product.media.items[0].url}
              alt={product.title}
              className="w-full aspect-video object-cover rounded"
            />
          ) : (
            <img
              src={product.media.items[0].url}
              alt={product.title}
              className="w-full aspect-square object-cover rounded"
            />
          )}
          {isDeal && (
            <span className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
              DEAL
            </span>
          )}
        </div>
      )}
      
      {/* Info */}
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
        {product.title}
      </h4>
      
      {product.body && (
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {product.body}
        </p>
      )}
      
      {/* Price */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          ${product.product.price}
        </span>
        {product.product.compareAt && (
          <span className="text-sm line-through text-gray-400">
            ${product.product.compareAt}
          </span>
        )}
      </div>
      
      {/* Seller */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        by @{product.product.seller.handle}
      </p>
      
      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onAskAI}
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Ask
        </button>
        
        <button
          onClick={handleBuy}
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors font-medium"
        >
          <ShoppingCart className="w-3 h-3" />
          Buy
        </button>
        
        <button
          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xs rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Bookmark className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
}

