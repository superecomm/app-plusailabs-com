/**
 * Message draft management
 * Saves drafts locally and syncs to Firestore
 */

import localforage from 'localforage';

export interface MessageDraft {
  threadId?: string;
  recipientHandle?: string;
  text: string;
  timestamp: number;
}

const drafts = localforage.createInstance({
  name: 'plusai-messaging',
  storeName: 'message_drafts',
});

/**
 * Save a draft message
 */
export async function saveDraft(key: string, draft: MessageDraft): Promise<void> {
  await drafts.setItem(key, {
    ...draft,
    timestamp: Date.now(),
  });
}

/**
 * Get a draft
 */
export async function getDraft(key: string): Promise<MessageDraft | null> {
  return await drafts.getItem<MessageDraft>(key);
}

/**
 * Delete a draft
 */
export async function deleteDraft(key: string): Promise<void> {
  await drafts.removeItem(key);
}

/**
 * Get all drafts
 */
export async function getAllDrafts(): Promise<Map<string, MessageDraft>> {
  const allDrafts = new Map<string, MessageDraft>();
  
  await drafts.iterate<MessageDraft, void>((value, key) => {
    allDrafts.set(key, value);
  });

  return allDrafts;
}

/**
 * Get draft key for a thread
 */
export function getThreadDraftKey(threadId: string): string {
  return `thread_${threadId}`;
}

/**
 * Get draft key for new message
 */
export function getNewMessageDraftKey(): string {
  return 'new_message';
}

