import { getFirestore } from "firebase-admin/firestore";
import type { ContentItem } from "@/types/content";

/**
 * Save a content item to Firestore
 */
export async function saveContentItem(item: ContentItem): Promise<void> {
  const db = getFirestore();
  await db.collection('contentItems').doc(item.id).set({
    ...item,
    createdAt: item.createdAt || new Date(),
    updatedAt: new Date(),
  });
}

/**
 * List content items for a user with optional filter
 */
export async function listContentItems(
  uid: string,
  filter: string = 'all'
): Promise<ContentItem[]> {
  const db = getFirestore();
  let query = db.collection('contentItems').where('ownerId', '==', uid);
  
  if (filter === 'posts') {
    query = query.where('type', '==', 'post').where('visibility', '==', 'public');
  } else if (filter === 'saved') {
    query = query.where('type', '==', 'saved');
  } else if (filter === 'media') {
    query = query.where('type', '==', 'media').where('visibility', '==', 'public');
  }
  
  query = query.orderBy('createdAt', 'desc').limit(50);
  
  const snapshot = await query.get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as ContentItem;
  });
}

/**
 * Update a content item
 */
export async function updateContentItem(
  id: string,
  updates: Partial<ContentItem>
): Promise<void> {
  const db = getFirestore();
  await db.collection('contentItems').doc(id).update({
    ...updates,
    updatedAt: new Date(),
  });
}

/**
 * Delete a content item
 */
export async function deleteContentItem(id: string): Promise<void> {
  const db = getFirestore();
  await db.collection('contentItems').doc(id).delete();
}

/**
 * Get a single content item
 */
export async function getContentItem(id: string): Promise<ContentItem | null> {
  const db = getFirestore();
  const doc = await db.collection('contentItems').doc(id).get();
  
  if (!doc.exists) return null;
  
  const data = doc.data()!;
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as ContentItem;
}

