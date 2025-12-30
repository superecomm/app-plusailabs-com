"use client";

import { FixedSizeList } from 'react-window';
import type { ConversationMessage } from '@/types/conversation';

interface VirtualizedMessageListProps {
  messages: ConversationMessage[];
  height: number;
  renderMessage: (message: ConversationMessage) => React.ReactNode;
}

export function VirtualizedMessageList({ 
  messages, 
  height, 
  renderMessage 
}: VirtualizedMessageListProps) {
  // Only virtualize for long conversations (50+ messages)
  if (messages.length <= 50) {
    return (
      <div>
        {messages.map((message) => (
          <div key={message.id}>{renderMessage(message)}</div>
        ))}
      </div>
    );
  }

  // Virtualized rendering for performance
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const message = messages[index];
    return (
      <div style={style} key={message.id}>
        {renderMessage(message)}
      </div>
    );
  };

  return (
    <FixedSizeList
      height={height}
      itemCount={messages.length}
      itemSize={120} // Conservative average message height
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}

