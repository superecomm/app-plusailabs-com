/**
 * Profile Discovery Utilities
 * Detects profile mentions in chat and enables discovery
 */

/**
 * Extract profile handles from text
 * Looks for @handle pattern (not +handle which is for vault)
 */
export function extractProfileHandles(text: string): string[] {
  const regex = /(?:^|\s)@([A-Za-z0-9_-]+)/g;
  const matches = [...text.matchAll(regex)];
  return matches.map((m) => m[1]);
}

/**
 * Search for profiles matching a query
 */
export async function searchProfiles(query: string): Promise<any[]> {
  try {
    const response = await fetch(`/api/profile/search?q=${encodeURIComponent(query)}`);
    if (response.ok) {
      const data = await response.json();
      return data.profiles || [];
    }
    return [];
  } catch (error) {
    console.error("Error searching profiles:", error);
    return [];
  }
}

/**
 * Check if text contains profile discovery intent
 * Examples: "find @john", "who is @terry", "show me @sarah's profile"
 */
export function hasProfileDiscoveryIntent(text: string): boolean {
  const patterns = [
    /(?:find|search|show|who is|lookup)\s+@([A-Za-z0-9_-]+)/i,
    /@([A-Za-z0-9_-]+)(?:'s)?\s+(?:profile|account|page)/i,
  ];
  
  return patterns.some(pattern => pattern.test(text));
}

/**
 * Extract profile search query from user message
 */
export function extractProfileQuery(text: string): string | null {
  // "find @john" → "john"
  const findMatch = text.match(/(?:find|search|show|who is|lookup)\s+@([A-Za-z0-9_-]+)/i);
  if (findMatch) return findMatch[1];
  
  // "@terry's profile" → "terry"
  const profileMatch = text.match(/@([A-Za-z0-9_-]+)(?:'s)?\s+(?:profile|account|page)/i);
  if (profileMatch) return profileMatch[1];
  
  return null;
}

