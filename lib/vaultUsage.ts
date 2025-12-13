// Vault Usage Audit Logging Service

import { getAdminFirestore } from "./firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { nanoid } from "nanoid";
import type { VaultRef } from "@/types/conversation";

export interface VaultUsageEvent {
  id: string;
  conversationId: string;
  messageId: string;
  vaultItemIds: string[];
  timestamp: Timestamp;
  model: string;
  provider: string;
  charCount: number;
  userId: string;
}

/**
 * Log vault usage event to Firestore
 * @param params - Usage event parameters
 */
export async function logVaultUsage(params: {
  userId: string;
  conversationId: string;
  messageId: string;
  vaultRefs: VaultRef[];
  model: string;
  charCount: number;
}): Promise<void> {
  try {
    const adminFirestore = getAdminFirestore();
    const eventId = nanoid();
    
    const event: Omit<VaultUsageEvent, 'id'> = {
      conversationId: params.conversationId,
      messageId: params.messageId,
      vaultItemIds: params.vaultRefs.map(ref => ref.id),
      timestamp: Timestamp.now(),
      model: params.model,
      provider: getProviderFromModel(params.model),
      charCount: params.charCount,
      userId: params.userId,
    };

    await adminFirestore
      .collection("users")
      .doc(params.userId)
      .collection("vaultUsageEvents")
      .doc(eventId)
      .set(event);
    
    console.log(`Vault usage logged: ${eventId}`, {
      items: params.vaultRefs.length,
      chars: params.charCount,
    });
  } catch (error) {
    // Log but don't throw - usage logging shouldn't break the app
    console.error("Failed to log vault usage:", error);
  }
}

/**
 * Helper to extract provider from model ID
 */
function getProviderFromModel(modelId: string): string {
  if (modelId.startsWith("gpt")) return "openai";
  if (modelId.startsWith("claude") || modelId.startsWith("sonnet")) return "anthropic";
  if (modelId.startsWith("gemini")) return "google";
  return "unknown";
}

/**
 * Get vault usage stats for a user
 * @param userId - User ID
 * @param limit - Number of recent events to fetch (default: 100)
 * @returns Array of usage events
 */
export async function getVaultUsageStats(
  userId: string,
  limit: number = 100
): Promise<VaultUsageEvent[]> {
  try {
    const adminFirestore = getAdminFirestore();
    const snapshot = await adminFirestore
      .collection("users")
      .doc(userId)
      .collection("vaultUsageEvents")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as VaultUsageEvent));
  } catch (error) {
    console.error("Failed to fetch vault usage stats:", error);
    return [];
  }
}

