"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { hapticMedium } from "@/lib/nativeFeel/haptics";
import { useAtMentionAutocomplete } from "@/hooks/useAtMentionAutocomplete";
import { AtMentionAutocomplete } from "./AtMentionAutocomplete";

interface MessageComposerProps {
  onSend: (text: string) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({ 
  onSend, 
  onTyping,
  disabled = false,
  placeholder = "Type a message..."
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // At mention (@) autocomplete
  const atMention = useAtMentionAutocomplete(textareaRef);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    hapticMedium();
    onSend(text.trim());
    setText("");
    onTyping?.(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Save draft (imported from drafts.ts if needed in future)

    // Typing indicator (debounced)
    if (onTyping) {
      onTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }

    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle at mention autocomplete navigation first
    atMention.onKeyDown(e);
    
    // If autocomplete didn't handle it, check for Enter to submit
    if (e.key === 'Enter' && !e.shiftKey && !atMention.isOpen) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* At mention (@) autocomplete dropdown */}
      {atMention.isOpen && (
        <AtMentionAutocomplete
          users={atMention.users}
          selectedIndex={atMention.selectedIndex}
          position={atMention.position}
          onSelect={atMention.onSelect}
          onClose={atMention.onClose}
        />
      )}
      
      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-800 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-32 overflow-y-auto"
          />
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </>
  );
}

