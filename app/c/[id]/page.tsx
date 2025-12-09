import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading chat…</div>}>
      <ChatInterface conversationId={id} />
    </Suspense>
  );
}

