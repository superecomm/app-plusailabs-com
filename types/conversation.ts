"use client";

export type ConversationMessageType = "text" | "image" | "file" | "system";

export type ConversationMessage = {
  id: string;
  conversationId: string;
  sender: "user" | "assistant";
  content: string;
  type: ConversationMessageType;
  timestamp: number;
  avatarType?: "user" | "neural";
  avatarUrl?: string;
  fileRefs?: string[];
  model?: string;
  tokenCount?: number;
};

export type ConversationPreview = {
  id: string;
  userId: string;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
};


