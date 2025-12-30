"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "@/lib/nativeFeel/clipboard";
import { hapticLight } from "@/lib/nativeFeel/haptics";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    
    if (success) {
      setCopied(true);
      hapticLight(); // Haptic feedback on copy
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-green-500" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

