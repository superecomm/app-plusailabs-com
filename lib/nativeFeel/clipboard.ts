/**
 * Clipboard utilities for copying and sharing content
 */

/**
 * Copy text to clipboard
 * Returns true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Check if Web Share API is supported
 */
export function isShareSupported(): boolean {
  return 'share' in navigator;
}

/**
 * Share content using Web Share API
 */
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (!isShareSupported()) {
    console.warn('Web Share API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name === 'AbortError') {
      return false; // User cancelled, not an error
    }
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * Check if clipboard read is supported
 */
export function isClipboardReadSupported(): boolean {
  return 'clipboard' in navigator && 'readText' in navigator.clipboard;
}

/**
 * Read text from clipboard (requires permission)
 */
export async function readFromClipboard(): Promise<string | null> {
  if (!isClipboardReadSupported()) {
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    return null;
  }
}

