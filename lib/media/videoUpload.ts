/**
 * Video upload and processing utilities
 */

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

export interface VideoUploadResult {
  url: string;
  thumbnail: string;
  duration: number;
  width: number;
  height: number;
}

/**
 * Upload video to Firebase Storage
 */
export async function uploadVideo(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<VideoUploadResult> {
  
  // 1. Generate thumbnail
  const thumbnail = await generateVideoThumbnail(file);
  
  // 2. Get video metadata
  const metadata = await getVideoMetadata(file);
  
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }
  
  // 3. Upload video
  const videoRef = ref(storage, `content/${userId}/videos/${Date.now()}_${file.name}`);
  await uploadBytes(videoRef, file);
  const videoUrl = await getDownloadURL(videoRef);
  
  // 4. Upload thumbnail
  const thumbRef = ref(storage, `content/${userId}/thumbnails/${Date.now()}.jpg`);
  await uploadBytes(thumbRef, thumbnail);
  const thumbnailUrl = await getDownloadURL(thumbRef);
  
  return {
    url: videoUrl,
    thumbnail: thumbnailUrl,
    duration: metadata.duration,
    width: metadata.width,
    height: metadata.height,
  };
}

/**
 * Generate thumbnail from video at 1 second mark
 */
export function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.currentTime = 1; // 1 second in
    
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not generate thumbnail'));
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => {
      reject(new Error('Could not load video'));
      URL.revokeObjectURL(video.src);
    };
  });
}

/**
 * Get video duration and dimensions
 */
export function getVideoMetadata(file: File): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      resolve({
        duration: Math.floor(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Could not load video metadata'));
      URL.revokeObjectURL(video.src);
    };
  });
}

/**
 * Format video duration for display (e.g., "2:35")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Validate video file
 */
export function validateVideo(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('video/')) {
    return { valid: false, error: 'File must be a video' };
  }
  
  // Check file size (max 100MB for free tier, can be tier-based)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Video must be under 100MB' };
  }
  
  return { valid: true };
}

