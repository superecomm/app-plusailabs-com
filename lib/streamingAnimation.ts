// Deliberate Stream with Soft Finality
// Calm, controlled streaming animation that feels intentional

/**
 * Calculate delay based on content for punctuation-aware pauses
 */
export function calculateTokenDelay(token: string, previousText: string): number {
  // Check what the token ends with
  const endsWithPeriod = /[.!?]\s*$/.test(token);
  const endsWithNewline = token.endsWith('\n\n') || token.endsWith('\n\n\n');
  const endsWithCodeFence = token.trim().endsWith('```');
  
  // Punctuation-aware pauses
  if (endsWithCodeFence || endsWithNewline) {
    return 150 + Math.random() * 100; // 150-250ms for paragraphs/code
  }
  if (endsWithPeriod) {
    return 80 + Math.random() * 40; // 80-120ms for sentence endings
  }
  
  // Base delay for normal flow
  return 30 + Math.random() * 20; // 30-50ms smooth baseline
}

/**
 * Calculate completion slowdown factor
 * As response nears completion, slow down slightly
 */
export function getCompletionSlowdown(currentLength: number, estimatedTotal: number): number {
  const progress = currentLength / Math.max(estimatedTotal, 100);
  
  // No slowdown for first 80%
  if (progress < 0.8) return 1.0;
  
  // Gentle slowdown in final 20%
  // From 1.0x to 1.5x speed reduction
  const slowdownFactor = 1.0 + ((progress - 0.8) / 0.2) * 0.5;
  return slowdownFactor;
}

/**
 * Entry delay before first token (intentional pause)
 */
export const ENTRY_DELAY_MS = 200; // 200ms deliberate pause

/**
 * Process token with appropriate delay
 */
export async function processTokenWithDelay(
  token: string,
  previousText: string,
  estimatedTotal: number
): Promise<void> {
  const baseDelay = calculateTokenDelay(token, previousText);
  const slowdown = getCompletionSlowdown(previousText.length, estimatedTotal);
  const finalDelay = baseDelay * slowdown;
  
  await new Promise(resolve => setTimeout(resolve, finalDelay));
}

