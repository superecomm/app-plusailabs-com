import { ChatProvider } from "@/contexts/ChatContext";

export default function StreamDiscLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatProvider>{children}</ChatProvider>;
}


