"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

export interface VaultItem {
  id: string;
  type: "bio" | "folder" | "file";
  name: string;
  content?: string;
  folderId?: string | null;
  allowInChat?: boolean;
}

interface AutocompletePosition {
  x: number;
  y: number;
}

interface UseVaultAutocompleteReturn {
  isOpen: boolean;
  query: string;
  items: VaultItem[];
  selectedIndex: number;
  position: AutocompletePosition;
  onSelect: (item: VaultItem) => void;
  onClose: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function useVaultAutocomplete(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  onInsertToken: (token: string, item: VaultItem) => void
): UseVaultAutocompleteReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<AutocompletePosition>({ x: 0, y: 0 });
  const [triggerPos, setTriggerPos] = useState<number | null>(null);

  // Monitor input for "+" trigger
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = () => {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.slice(0, cursorPos);
      
      // Look for + at start or after whitespace
      const match = textBeforeCursor.match(/(?:^|\s)\+([A-Za-z0-9_-]*)$/);
      
      if (match) {
        const queryText = match[1];
        setQuery(queryText);
        setTriggerPos(cursorPos - queryText.length - 1); // Position of +
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

  // Fetch and filter vault items
  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      try {
        // TODO: Replace with actual API call
        // For now, return mock data
        const mockItems: VaultItem[] = [
          { id: "bio-1", type: "bio", name: "Bio", content: "User bio content...", allowInChat: true },
          { id: "folder-1", type: "folder", name: "Family", allowInChat: true },
          { id: "folder-2", type: "folder", name: "Projects", allowInChat: true },
          { id: "file-1", type: "file", name: "Recipes", folderId: "folder-1", allowInChat: true },
          { id: "file-2", type: "file", name: "Finance", folderId: null, allowInChat: false },
        ];
        
        // Filter by query (fuzzy search - basic implementation)
        const filtered = mockItems.filter(item => {
          if (!item.allowInChat) return false;
          const searchText = item.name.toLowerCase();
          const queryLower = query.toLowerCase();
          return searchText.includes(queryLower);
        });
        
        setItems(filtered.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error("Failed to fetch vault items:", error);
        setItems([]);
      }
    };

    // Debounce fetch
    const timerId = setTimeout(fetchItems, 150);
    return () => clearTimeout(timerId);
  }, [query, isOpen]);

  const onSelect = useCallback((item: VaultItem) => {
    const textarea = textareaRef.current;
    if (!textarea || triggerPos === null) return;

    // Replace +query with +tokenName
    const before = textarea.value.slice(0, triggerPos);
    const after = textarea.value.slice(textarea.selectionStart);
    const token = `+${item.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    textarea.value = before + token + ' ' + after;
    
    // Move cursor after inserted token
    const newCursorPos = before.length + token.length + 1;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    
    // Trigger input event to update React state
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Call parent callback with token and item
    onInsertToken(token, item);
    
    // Close autocomplete
    setIsOpen(false);
    setTriggerPos(null);
    
    // Refocus textarea
    textarea.focus();
  }, [textareaRef, triggerPos, onInsertToken]);

  const onClose = useCallback(() => {
    setIsOpen(false);
    setTriggerPos(null);
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
        if (items[selectedIndex]) {
          e.preventDefault();
          onSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, items, selectedIndex, onSelect, onClose]);

  return {
    isOpen,
    query,
    items,
    selectedIndex,
    position,
    onSelect,
    onClose,
    onKeyDown,
  };
}

