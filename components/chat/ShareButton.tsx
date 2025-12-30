"use client";

import { useState } from "react";
import { Share as ShareIcon } from "lucide-react";
import { shareContent, isShareSupported, copyToClipboard } from "@/lib/nativeFeel/clipboard";
import { hapticLight } from "@/lib/nativeFeel/haptics";

interface ShareButtonProps {
  text: string;
  title?: string;
}

export function ShareButton({ text, title = "Shared from +AI" }: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    hapticLight();

    try {
      if (isShareSupported()) {
        // Try Web Share API first
        await shareContent({ title, text });
      } else {
        // Fallback to copy
        await copyToClipboard(text);
        alert('Copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
      title="Share"
    >
      <ShareIcon className="w-3 h-3" />
      <span>{sharing ? 'Sharing...' : 'Share'}</span>
    </button>
  );
}

