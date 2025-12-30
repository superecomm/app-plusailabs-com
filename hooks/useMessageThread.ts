"use client";

import { useState, useEffect } from "react";
import { getFirestore, collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import type { DirectMessage } from "@/types/messaging";

export function useMessageThread(threadId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const db = getFirestore();
    
    const q = query(
      collection(db, 'messageThreads', threadId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            senderId: data.senderId,
            text: data.text,
            createdAt: data.createdAt?.toDate(),
            editedAt: data.editedAt?.toDate(),
            deleted: data.deleted,
            deletedBy: data.deletedBy,
          } as DirectMessage;
        });
        
        setMessages(msgs);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [threadId]);

  return { messages, loading };
}

