import { getFirestore, collection, doc, query, where, getDocs, setDoc, updateDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import type { MessageThread } from "@/types/messaging";
import { nanoid } from "nanoid";

/**
 * Find or create a thread between two users
 */
export async function findOrCreateThread(
  userId1: string,
  userId2: string,
  user1Data: { handle: string; displayName: string; photoURL?: string },
  user2Data: { handle: string; displayName: string; photoURL?: string }
): Promise<string> {
  const db = getFirestore();
  
  // Check if thread already exists
  const existingThread = await findThreadBetweenUsers(userId1, userId2);
  if (existingThread) {
    return existingThread.id;
  }

  // Create new thread
  const threadId = nanoid();
  const threadData: any = {
    id: threadId,
    participants: [userId1, userId2],
    participantData: {
      [userId1]: user1Data,
      [userId2]: user2Data,
    },
    lastMessage: {
      text: '',
      senderId: '',
      timestamp: serverTimestamp(),
    },
    lastReadAt: {
      [userId1]: serverTimestamp(),
      [userId2]: serverTimestamp(),
    },
    unreadCount: {
      [userId1]: 0,
      [userId2]: 0,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'messageThreads', threadId), threadData);
  
  return threadId;
}

/**
 * Find existing thread between two users
 */
export async function findThreadBetweenUsers(
  userId1: string,
  userId2: string
): Promise<MessageThread | null> {
  const db = getFirestore();
  
  const q = query(
    collection(db, 'messageThreads'),
    where('participants', 'array-contains', userId1)
  );
  
  const snapshot = await getDocs(q);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.participants.includes(userId2)) {
      return {
        id: docSnap.id,
        ...data,
        lastMessage: {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate(),
        },
        lastReadAt: Object.fromEntries(
          Object.entries(data.lastReadAt || {}).map(([k, v]: [string, any]) => [k, v?.toDate()])
        ),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as MessageThread;
    }
  }
  
  return null;
}

/**
 * List all threads for a user
 */
export async function listUserThreads(userId: string): Promise<MessageThread[]> {
  const db = getFirestore();
  
  const q = query(
    collection(db, 'messageThreads'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      lastMessage: {
        ...data.lastMessage,
        timestamp: data.lastMessage.timestamp?.toDate(),
      },
      lastReadAt: Object.fromEntries(
        Object.entries(data.lastReadAt || {}).map(([k, v]: [string, any]) => [k, v?.toDate()])
      ),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as MessageThread;
  });
}

/**
 * Update last read timestamp for a user in a thread
 */
export async function updateLastReadAt(threadId: string, userId: string): Promise<void> {
  const db = getFirestore();
  
  await updateDoc(doc(db, 'messageThreads', threadId), {
    [`lastReadAt.${userId}`]: serverTimestamp(),
    [`unreadCount.${userId}`]: 0,
  });
}

/**
 * Archive thread for a user
 */
export async function archiveThread(threadId: string, userId: string): Promise<void> {
  const db = getFirestore();
  
  await updateDoc(doc(db, 'messageThreads', threadId), {
    [`archived.${userId}`]: true,
  });
}

