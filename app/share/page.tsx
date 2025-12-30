"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ShareTargetPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleShare = async () => {
      // Require authentication
      if (!currentUser) {
        // Store the intent to share and redirect to login
        sessionStorage.setItem('share_intent', 'true');
        router.push('/');
        return;
      }

      try {
        // Parse the shared data from the POST request
        // This will be handled by the service worker / manifest
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        
        let sharedText = '';
        
        // Get shared text
        const title = params.get('title');
        const text = params.get('text');
        const sharedUrl = params.get('url');
        
        // Combine into a single message
        if (title) {
          sharedText += `${title}\n\n`;
        }
        if (text) {
          sharedText += text;
        }
        if (sharedUrl) {
          if (sharedText) sharedText += '\n\n';
          sharedText += `Check out: ${sharedUrl}`;
        }
        
        // Store in session storage for the dashboard to pick up
        if (sharedText.trim()) {
          sessionStorage.setItem('shared_content', sharedText.trim());
        }
        
        // Handle shared files (future enhancement)
        // For now, just note that files were shared
        const hasFiles = url.searchParams.has('file');
        if (hasFiles) {
          console.log('[Share] Files shared - not yet implemented');
        }
        
        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('[Share] Error handling shared content:', error);
        router.push('/dashboard');
      }
    };

    handleShare();
  }, [currentUser, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
        <p className="text-white">Processing shared content...</p>
      </div>
    </div>
  );
}

