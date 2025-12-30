"use client";

import { useState, useEffect, useCallback } from "react";
import { getFirestore, collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export function useTypingIndicator(threadId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Listen for typing status from other users
  useEffect(() => {
    if (!threadId || !currentUserId) return;

    const db = getFirestore();
    
    const unsubscribe = onSnapshot(
      collection(db, 'messageThreads', threadId, 'presence'),
      (snapshot) => {
        const now = Date.now();
        const typing: string[] = [];
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const userId = doc.id;
          
          // Only show if:
          // - Not current user
          // - typing is true
          // - updatedAt is within last 5 seconds
          if (
            userId !== currentUserId &&
            data.typing === true &&
            data.updatedAt?.toDate &&
            now - data.updatedAt.toDate().getTime() < 5000
          ) {
            typing.push(userId);
          }
        });
        
        setTypingUsers(typing);
      }
    );

    return () => unsubscribe();
  }, [threadId, currentUserId]);

  // Set typing status (debounced)
  const setTyping = useCallback((isTyping: boolean) => {
    if (!threadId || !currentUserId) return;

    const db = getFirestore();
    const presenceRef = doc(db, 'messageThreads', threadId, 'presence', currentUserId);

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (isTyping) {
      // Set typing = true
      setDoc(presenceRef, {
        typing: true,
        updatedAt: serverTimestamp(),
      });

      // Auto-clear after 3 seconds
      const timeout = setTimeout(() => {
        setDoc(presenceRef, {
          typing: false,
          updatedAt: serverTimestamp(),
        });
      }, 3000);

      setTypingTimeout(timeout);
    } else {
      // Set typing = false immediately
      setDoc(presenceRef, {
        typing: false,
        updatedAt: serverTimestamp(),
      });
    }
  }, [threadId, currentUserId, typingTimeout]);

  return { typingUsers, setTyping };
}

