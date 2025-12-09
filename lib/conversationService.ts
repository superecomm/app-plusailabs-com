import { db } from "@/lib/firebase/client";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  deleteDoc,
} from "firebase/firestore";
import type { ConversationMessage, ConversationPreview } from "@/types/conversation";

const CONVERSATION_CACHE_KEY = (userId: string, conversationId: string) =>
  `viim:conversation:${userId}:${conversationId}`;

const PREVIEW_CACHE_KEY = (userId: string) => `viim:conversations:${userId}`;

function assertDb() {
  if (!db) {
    throw new Error(
      "Firebase client is not initialized. Please ensure .env.local contains the required NEXT_PUBLIC_FIREBASE_* values."
    );
  }
  return db;
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: ConversationPreview[]) => void
) {
  const firestore = assertDb();
  const conversationsRef = collection(firestore, "conversations");
  const q = query(
    conversationsRef,
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const list: ConversationPreview[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId,
        title: data.title || "Untitled",
        model: data.model || "gpt-4o-mini",
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
      };
    });
    cacheConversationPreviews(userId, list);
    callback(list);
  });

  return unsubscribe;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: ConversationMessage[]) => void
) {
  const firestore = assertDb();
  const messagesRef = collection(firestore, "conversations", conversationId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages: ConversationMessage[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        conversationId,
        sender: data.sender,
        content: data.content,
        type: data.type || "text",
        timestamp: data.timestamp?.toMillis?.() ?? Date.now(),
        avatarType: data.avatarType,
        avatarUrl: data.avatarUrl,
        fileRefs: data.fileRefs,
        model: data.model,
      };
    });
    callback(messages);
  });

  return unsubscribe;
}

export async function createConversation(
  userId: string,
  model: string,
  initialTitle = "Untitled"
): Promise<string> {
  const firestore = assertDb();
  const conversationsRef = collection(firestore, "conversations");
  const docRef = doc(conversationsRef);
  const now = serverTimestamp();

  await setDoc(docRef, {
    userId,
    title: initialTitle,
    model,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function appendConversationMessage(
  conversationId: string,
  message: Omit<ConversationMessage, "id" | "timestamp">
) {
  const firestore = assertDb();
  const messagesRef = collection(firestore, "conversations", conversationId, "messages");
  const now = serverTimestamp();

  // Build payload without undefined fields (Firestore rejects undefined)
  const payload: Record<string, unknown> = {
    sender: message.sender,
    content: message.content,
    type: message.type ?? "text",
    fileRefs: message.fileRefs || [],
    timestamp: now,
  };

  if (message.avatarType !== undefined) payload.avatarType = message.avatarType;
  if (message.avatarUrl !== undefined) payload.avatarUrl = message.avatarUrl ?? null;
  if (message.model !== undefined) payload.model = message.model;

  await addDoc(messagesRef, payload);

  const conversationRef = doc(firestore, "conversations", conversationId);
  await updateDoc(conversationRef, {
    updatedAt: now,
    lastPreview: message.content.slice(0, 120),
  });
}

export async function updateConversationTitle(conversationId: string, title: string) {
  const firestore = assertDb();
  const conversationRef = doc(firestore, "conversations", conversationId);
  await updateDoc(conversationRef, { title, updatedAt: serverTimestamp() });
}

export async function deleteConversation(conversationId: string) {
  const firestore = assertDb();
  const conversationRef = doc(firestore, "conversations", conversationId);
  // Delete subcollection messages
  const messagesRef = collection(firestore, "conversations", conversationId, "messages");
  const snapshot = await getDocs(messagesRef);
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
  await deleteDoc(conversationRef);
}

// ---------- Local Storage Helpers ----------

function cacheConversationPreviews(userId: string, previews: ConversationPreview[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREVIEW_CACHE_KEY(userId), JSON.stringify(previews));
  } catch {
    // Ignore write errors
  }
}

export function loadCachedConversationPreviews(userId: string): ConversationPreview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PREVIEW_CACHE_KEY(userId));
    if (!raw) return [];
    return JSON.parse(raw) as ConversationPreview[];
  } catch {
    return [];
  }
}

export function cacheConversationMessages(
  userId: string,
  conversationId: string,
  messages: ConversationMessage[]
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CONVERSATION_CACHE_KEY(userId, conversationId),
      JSON.stringify(messages)
    );
  } catch {
    // Ignore
  }
}

export function loadCachedConversationMessages(
  userId: string,
  conversationId: string
): ConversationMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONVERSATION_CACHE_KEY(userId, conversationId));
    if (!raw) return [];
    return JSON.parse(raw) as ConversationMessage[];
  } catch {
    return [];
  }
}

export function clearCachedConversation(userId: string, conversationId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CONVERSATION_CACHE_KEY(userId, conversationId));
}


