"use client";

import { LaunchScreen } from "@/components/launch/LaunchScreen";
import { ChatProvider } from "@/contexts/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <LaunchScreen />
    </ChatProvider>
  );
}
