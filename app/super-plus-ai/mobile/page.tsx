"use client";

import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function MobileChatApp() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading chat…</div>}>
      <ChatInterface />
    </Suspense>
  );
}
