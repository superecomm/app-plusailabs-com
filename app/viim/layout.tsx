import { ChatProvider } from "@/contexts/ChatContext";

export default function ViimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatProvider>{children}</ChatProvider>;
}

