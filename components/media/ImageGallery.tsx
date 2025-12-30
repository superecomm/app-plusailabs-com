"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/types/content";

interface ImageGalleryProps {
  images: MediaItem[];
  className?: string;
}

export function ImageGallery({ images, className = "" }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const goToNext = () => {
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main image */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].caption || `Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation arrows (if multiple images) */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* Caption */}
        {images[currentIndex].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <p className="text-white text-sm">{images[currentIndex].caption}</p>
          </div>
        )}
      </div>
      
      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

