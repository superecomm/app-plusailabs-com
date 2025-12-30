"use client";

import { useState } from "react";
import { MessageSquare, ShoppingCart, Bookmark, ExternalLink } from "lucide-react";
import type { ContentItem } from "@/types/content";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { ImageGallery } from "@/components/media/ImageGallery";
import { CommentSection } from "@/components/social/CommentSection";
import { hapticLight } from "@/lib/nativeFeel/haptics";

interface BuyCardProps {
  product: ContentItem;
  onAskAI?: () => void;
  onSave?: () => void;
  compact?: boolean;
}

export function BuyCard({ product, onAskAI, onSave, compact = false }: BuyCardProps) {
  const [saved, setSaved] = useState(false);
  
  if (!product.product) return null;

  const handleSave = () => {
    setSaved(!saved);
    hapticLight();
    onSave?.();
  };

  const handleBuy = () => {
    hapticLight();
    
    if (product.product?.affiliate?.url) {
      window.open(product.product.affiliate.url, '_blank');
    } else {
      // Future: direct checkout
      alert('Direct checkout coming soon!');
    }
  };

  const handleAskAI = () => {
    hapticLight();
    onAskAI?.();
  };

  // Check if it's a deal
  const isDeal = product.product.compareAt && 
                 product.product.compareAt > product.product.price;
  const savingsPercent = isDeal
    ? Math.round(((product.product.compareAt! - product.product.price) / product.product.compareAt!) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Media */}
      {product.media?.items && product.media.items.length > 0 && (
        <div className="relative">
          {product.media.items[0].type === 'video' ? (
            <VideoPlayer
              src={product.media.items[0].url}
              thumbnail={product.media.items[0].thumbnail}
              controls={!compact}
            />
          ) : product.media.items.length === 1 ? (
            <img
              src={product.media.items[0].url}
              alt={product.title}
              className="w-full aspect-square object-cover"
            />
          ) : (
            <ImageGallery images={product.media.items} />
          )}
          
          {/* Deal badge */}
          {isDeal && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
              {savingsPercent}% OFF
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <h3 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm line-clamp-2' : 'text-base'}`}>
          {product.title}
        </h3>
        
        {!compact && product.body && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
            {product.body}
          </p>
        )}
        
        {/* Price */}
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ${product.product.price}
          </span>
          {product.product.compareAt && (
            <span className="text-sm line-through text-gray-400">
              ${product.product.compareAt}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {product.product.currency || 'USD'}
          </span>
        </div>
        
        {/* Seller */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          by @{product.product.seller.handle}
        </p>
        
        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={handleAskAI}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ask AI
          </button>
          
          <button
            onClick={handleBuy}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Buy
          </button>
          
          <button
            onClick={handleSave}
            className={`flex items-center justify-center gap-1 px-3 py-2 text-sm rounded transition-colors ${
              saved
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
        
        {/* Stats (if public) */}
        {product.stats && (product.stats.saves > 0 || product.stats.purchases) && (
          <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            {product.stats.saves > 0 && (
              <span>{product.stats.saves} saves</span>
            )}
            {product.stats.purchases && product.stats.purchases > 0 && (
              <span>{product.stats.purchases} sold</span>
            )}
          </div>
        )}
        
        {/* Comments/Reviews Section */}
        {!compact && (
          <CommentSection contentId={product.id} contentType="product" />
        )}
      </div>
    </div>
  );
}

