import localforage from 'localforage';

export interface QueuedMessage {
  id: string;
  conversationId: string;
  text: string;
  model: string;
  timestamp: number;
  status: 'pending' | 'sending' | 'failed';
  retryCount: number;
  error?: string;
}

// Configure localForage
const outbox = localforage.createInstance({
  name: 'plusai-pwa',
  storeName: 'message_outbox',
  description: 'Queued messages for offline support'
});

/**
 * Add a message to the outbox queue
 */
export async function enqueueMessage(
  id: string,
  conversationId: string,
  text: string,
  model: string
): Promise<void> {
  const message: QueuedMessage = {
    id,
    conversationId,
    text,
    model,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  await outbox.setItem(id, message);
  console.log('[Outbox] Message queued:', id);
  
  // Dispatch event so UI can update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

/**
 * Get all queued messages
 */
export async function getQueuedMessages(): Promise<QueuedMessage[]> {
  const messages: QueuedMessage[] = [];
  
  await outbox.iterate<QueuedMessage, void>((value) => {
    messages.push(value);
  });

  // Sort by timestamp (oldest first)
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Get queued messages for a specific conversation
 */
export async function getQueuedMessagesForConversation(
  conversationId: string
): Promise<QueuedMessage[]> {
  const allMessages = await getQueuedMessages();
  return allMessages.filter(msg => msg.conversationId === conversationId);
}

/**
 * Update message status to 'sending'
 */
export async function markMessageSending(id: string): Promise<void> {
  const message = await outbox.getItem<QueuedMessage>(id);
  if (!message) return;

  message.status = 'sending';
  await outbox.setItem(id, message);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

/**
 * Remove message from outbox (successfully sent)
 */
export async function markMessageSent(id: string): Promise<void> {
  await outbox.removeItem(id);
  console.log('[Outbox] Message sent and removed:', id);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

/**
 * Mark message as failed and increment retry count
 */
export async function markMessageFailed(
  id: string,
  error: string
): Promise<void> {
  const message = await outbox.getItem<QueuedMessage>(id);
  if (!message) return;

  message.status = 'failed';
  message.retryCount += 1;
  message.error = error;
  
  await outbox.setItem(id, message);
  console.log('[Outbox] Message failed:', id, error);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

/**
 * Get a specific queued message
 */
export async function getQueuedMessage(id: string): Promise<QueuedMessage | null> {
  return await outbox.getItem<QueuedMessage>(id);
}

/**
 * Retry all pending messages
 * Returns array of message IDs that should be retried
 */
export async function getPendingMessagesForRetry(): Promise<QueuedMessage[]> {
  const messages = await getQueuedMessages();
  
  // Get pending or failed messages with retry count < 3
  return messages.filter(msg => 
    (msg.status === 'pending' || msg.status === 'failed') && 
    msg.retryCount < 3
  );
}

/**
 * Clear all messages from outbox (for testing)
 */
export async function clearOutbox(): Promise<void> {
  await outbox.clear();
  console.log('[Outbox] Cleared all messages');
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('outbox-updated'));
  }
}

/**
 * Get count of queued messages
 */
export async function getQueuedMessageCount(): Promise<number> {
  return await outbox.length();
}

