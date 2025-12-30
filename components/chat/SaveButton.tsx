"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SaveButtonProps {
  messageText: string;
  messageId: string;
  conversationId: string;
}

export function SaveButton({ messageText, messageId, conversationId }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { currentUser } = useAuth();

  const handleSave = async () => {
    if (!currentUser || saving || saved) return;

    setSaving(true);
    
    try {
      // Extract a title from the first line or first 50 chars
      const title = messageText.split('\n')[0].slice(0, 50) + (messageText.length > 50 ? '...' : '');
      
      // Get ID token for auth
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title,
          body: messageText,
          source: {
            conversationId,
            messageId,
          },
          tags: [],
        }),
      });

      if (response.ok) {
        setSaved(true);
      } else {
        console.error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving || saved}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
      title={saved ? "Saved" : "Save this response"}
    >
      <Bookmark className={`w-3 h-3 ${saved ? 'fill-current' : ''}`} />
      <span>{saving ? 'Saving...' : saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}

