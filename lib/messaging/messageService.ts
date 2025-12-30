import { getFirestore, collection, doc, addDoc, query, orderBy, limit, getDocs, updateDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import type { DirectMessage } from "@/types/messaging";

/**
 * Send a message in a thread
 */
export async function sendMessage(
  threadId: string,
  senderId: string,
  text: string,
  recipientId: string
): Promise<string> {
  const db = getFirestore();
  
  // Create message
  const messageData: any = {
    senderId,
    text: text.trim(),
    createdAt: serverTimestamp(),
  };
  
  const messageRef = await addDoc(
    collection(db, 'messageThreads', threadId, 'messages'),
    messageData
  );
  
  // Update thread
  await updateDoc(doc(db, 'messageThreads', threadId), {
    lastMessage: {
      text: text.trim(),
      senderId,
      timestamp: serverTimestamp(),
    },
    [`unreadCount.${recipientId}`]: increment(1),
    updatedAt: serverTimestamp(),
  });
  
  return messageRef.id;
}

/**
 * Get messages for a thread
 */
export async function getThreadMessages(
  threadId: string,
  limitCount: number = 100
): Promise<DirectMessage[]> {
  const db = getFirestore();
  
  const q = query(
    collection(db, 'messageThreads', threadId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      editedAt: data.editedAt?.toDate(),
    } as DirectMessage;
  }).reverse(); // Oldest first for display
}

/**
 * Set typing status (debounce this client-side)
 */
export async function setTypingStatus(
  threadId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const db = getFirestore();
  
  if (isTyping) {
    await setDoc(
      doc(db, 'messageThreads', threadId, 'presence', userId),
      {
        typing: true,
        updatedAt: serverTimestamp(),
      }
    );
  } else {
    await setDoc(
      doc(db, 'messageThreads', threadId, 'presence', userId),
      {
        typing: false,
        updatedAt: serverTimestamp(),
      }
    );
  }
}

/**
 * Delete message (soft delete for sender)
 */
export async function deleteMessage(
  threadId: string,
  messageId: string,
  userId: string
): Promise<void> {
  const db = getFirestore();
  
  await updateDoc(
    doc(db, 'messageThreads', threadId, 'messages', messageId),
    {
      deleted: true,
      [`deletedBy.${userId}`]: true,
    }
  );
}

