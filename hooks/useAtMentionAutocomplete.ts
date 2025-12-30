"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

/**
 * At mention (@) Autocomplete
 * 
 * At mention (@) is a social mention system for people and messaging.
 * Triggers when user types @ followed by a username query.
 * Fetches matching user profiles from /api/profile/search.
 */

export interface UserProfile {
  userId: string;
  displayName: string;
  handle: string;
  photoURL?: string;
  bio?: string;
  isYou?: boolean;
}

interface AutocompletePosition {
  x: number;
  y: number;
}

interface UseAtMentionAutocompleteReturn {
  isOpen: boolean;
  query: string;
  users: UserProfile[];
  selectedIndex: number;
  position: AutocompletePosition;
  onSelect: (user: UserProfile) => void;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function useAtMentionAutocomplete(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  onInsertMention?: (handle: string, user: UserProfile) => void
): UseAtMentionAutocompleteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<AutocompletePosition>({ x: 0, y: 0 });
  const [triggerPos, setTriggerPos] = useState<number | null>(null);

  // Monitor input for "@" trigger
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      
      // Look for @ at start or after whitespace
      const match = textBeforeCursor.match(/(?:^|\s)@([A-Za-z0-9_-]*)$/);
      
      if (match) {
        const queryText = match[1];
        setQuery(queryText);
        setTriggerPos(cursorPos - queryText.length - 1); // Position of @
        setIsOpen(true);
        setSelectedIndex(0);
        
        // Calculate dropdown position
        const rect = textarea.getBoundingClientRect();
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length - 1;
        const lineHeight = 24; // Approximate
        
        setPosition({
          x: rect.left + 10,
          y: rect.top + (currentLine * lineHeight) - textarea.scrollTop + 30,
        });
      } else {
        setIsOpen(false);
        setTriggerPos(null);
      }
    };

    textarea.addEventListener('input', handleInput);
    return () => textarea.removeEventListener('input', handleInput);
  }, [textareaRef]);

  // Fetch and filter users
  useEffect(() => {
    if (!isOpen) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/profile/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data.profiles || []);
        }
      } catch (error) {
        console.error('Error fetching users for at mention:', error);
        setUsers([]);
      }
    };

    // Debounce the search
    const timerId = setTimeout(fetchUsers, 150);
    return () => clearTimeout(timerId);
  }, [query, isOpen]);

  const onSelect = useCallback((user: UserProfile) => {
    const textarea = textareaRef.current;
    if (!textarea || triggerPos === null) return;

    // Replace @query with @handle
    const before = textarea.value.slice(0, triggerPos);
    const after = textarea.value.slice(textarea.selectionStart);
    const mention = `@${user.handle}`;
    
    textarea.value = before + mention + ' ' + after;
    
    // Move cursor after inserted mention
    const newCursorPos = before.length + mention.length + 1;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger input event to update React state
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Call parent callback if provided
    if (onInsertMention) {
      onInsertMention(user.handle, user);
    }
    
    // Close autocomplete
    setIsOpen(false);
    setTriggerPos(null);
    
    // Refocus textarea
    textarea.focus();
  }, [textareaRef, triggerPos, onInsertMention]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    setTriggerPos(null);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % users.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
        break;
      case 'Enter':
        if (users[selectedIndex]) {
          e.preventDefault();
          onSelect(users[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, users, selectedIndex, onSelect, onClose]);

  return {
    isOpen,
    query,
    users,
    selectedIndex,
    position,
    onSelect,
    onClose,
    onKeyDown,
  };
}

