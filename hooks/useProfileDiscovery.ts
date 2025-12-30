/**
 * Hook to detect and handle profile discovery in chat messages
 */

import { useEffect, useState } from 'react';
import { hasProfileDiscoveryIntent, extractProfileQuery, searchProfiles } from '@/lib/profileDiscovery';

export function useProfileDiscovery(messageText: string) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkForProfileIntent = async () => {
      if (!hasProfileDiscoveryIntent(messageText)) {
        setProfiles([]);
        return;
      }

      const query = extractProfileQuery(messageText);
      if (!query) return;

      setLoading(true);
      try {
        const results = await searchProfiles(query);
        setProfiles(results);
      } catch (error) {
        console.error('Error discovering profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    checkForProfileIntent();
  }, [messageText]);

  return { profiles, loading, hasIntent: hasProfileDiscoveryIntent(messageText) };
}

