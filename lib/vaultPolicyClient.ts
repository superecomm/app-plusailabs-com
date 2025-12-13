// Client-safe vault policy functions (no firebase-admin imports)

import type { VaultRef } from "@/types/conversation";

export interface VaultContext {
  items: Array<{
    source: string;
    content: string;
    chars: number;
  }>;
  totalChars: number;
  exceeded: boolean;
}

/**
 * Resolve vault context via API route (client-safe)
 */
export async function resolveVaultContext(
  userId: string,
  vaultRefs: VaultRef[],
  budget: number
): Promise<VaultContext> {
  try {
    const response = await fetch('/api/vault/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, vaultRefs, budget }),
    });

    if (!response.ok) {
      throw new Error('Failed to resolve vault context');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to resolve vault context:', error);
    return { items: [], totalChars: 0, exceeded: false };
  }
}

/**
 * Build prompt with vault context injected
 */
export function buildPromptWithVault(
  userText: string,
  vaultContext?: VaultContext
): string {
  const blocks: string[] = [];
  
  blocks.push("System: You are a helpful, concise assistant. Keep answers safe and clear.");
  blocks.push("Safety: Avoid harmful, private, or disallowed content.");
  
  if (vaultContext && vaultContext.items.length > 0) {
    blocks.push("User Context (from +Vault):");
    for (const item of vaultContext.items) {
      blocks.push(`- ${item.source}:`);
      blocks.push(item.content);
    }
  }
  
  blocks.push("Task:");
  blocks.push(userText.trim());
  
  return blocks.join("\n\n");
}

