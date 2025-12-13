// Vault Policy Service - Handles vault content resolution and budget enforcement

import type { VaultRef } from "@/types/conversation";
import { getVaultBio, listVaultFiles, listVaultFolders } from "./firestore";

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
 * Resolve vault context from vault references within character budget
 * @param userId - User ID
 * @param vaultRefs - Array of vault references from message
 * @param budget - Character budget (tier-based: 1.5k/6k/12k)
 * @returns Resolved vault context with content and metadata
 */
export async function resolveVaultContext(
  userId: string,
  vaultRefs: VaultRef[],
  budget: number
): Promise<VaultContext> {
  const items: Array<{ source: string; content: string; chars: number }> = [];
  let totalChars = 0;

  for (const ref of vaultRefs) {
    // Stop if budget already exceeded
    if (totalChars >= budget) break;

    try {
      let content = "";

      // Fetch content based on type
      switch (ref.type) {
        case "bio": {
          const bio = await getVaultBio(userId);
          content = bio.content || "";
          break;
        }

        case "folder": {
          // For folders, get all files within and concatenate
          const files = await listVaultFiles(userId, ref.id);
          const allowedFiles = files.filter(f => {
            // Assuming files have allowInChat property (add if needed)
            return true; // For now, include all files in folder
          });
          
          content = allowedFiles
            .map(f => `File: ${f.name}\n(File content would be fetched here)`)
            .join("\n\n");
          break;
        }

        case "file": {
          // Fetch specific file content
          // For now, placeholder - would fetch actual file content
          content = `File content for ${ref.name} (to be implemented)`;
          break;
        }
      }

      if (!content) continue;

      // Calculate remaining budget
      const remainingBudget = budget - totalChars;
      
      // Truncate content if it exceeds remaining budget
      const truncatedContent = truncate(content, remainingBudget);

      items.push({
        source: ref.name,
        content: truncatedContent,
        chars: truncatedContent.length,
      });

      totalChars += truncatedContent.length;
    } catch (error) {
      console.error(`Failed to resolve vault ref ${ref.id}:`, error);
      // Continue with other refs even if one fails
      continue;
    }
  }

  return {
    items,
    totalChars,
    exceeded: totalChars >= budget,
  };
}

/**
 * Truncate text to max characters with ellipsis
 */
function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}

/**
 * Build prompt with vault context injected
 * @param userText - User's message text
 * @param vaultContext - Resolved vault context
 * @returns Complete prompt with vault context
 */
export function buildPromptWithVault(
  userText: string,
  vaultContext?: VaultContext
): string {
  const blocks: string[] = [];
  
  // System instructions
  blocks.push("System: You are a helpful, concise assistant. Keep answers safe and clear.");
  blocks.push("Safety: Avoid harmful, private, or disallowed content.");
  
  // Vault context (if available)
  if (vaultContext && vaultContext.items.length > 0) {
    blocks.push("User Context (from +Vault):");
    for (const item of vaultContext.items) {
      blocks.push(`- ${item.source}:`);
      blocks.push(item.content);
    }
  }
  
  // User message
  blocks.push("Task:");
  blocks.push(userText.trim());
  
  return blocks.join("\n\n");
}

