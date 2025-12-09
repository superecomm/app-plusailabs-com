"use client";

import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ChatProvider } from "@/contexts/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading chat...</div>}>
        <ChatInterface />
      </Suspense>
    </ChatProvider>
  );
}
