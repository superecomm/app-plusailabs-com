import { Timestamp } from "firebase/firestore";

export interface BaseDocument {
  id?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserProfile extends BaseDocument {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  providerId?: string;
  // System metadata
  lastLoginAt?: Timestamp;
  isEmailVerified?: boolean;
}

export interface UserPreferences extends BaseDocument {
  userId: string;
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  language: string;
  // Voice/Audio settings
  autoPlayAudio: boolean;
  transcriptionEnabled: boolean;
  defaultModel: string; // e.g., "gpt-4o"
}

export interface Device extends BaseDocument {
  userId: string;
  deviceId: string;
  name: string; // e.g., "iPhone 15"
  type: "mobile" | "desktop" | "tablet" | "other";
  lastActiveAt: Timestamp;
  pushToken?: string;
  fingerprint?: string; // Browser fingerprint hash
}

export interface Conversation extends BaseDocument {
  userId: string;
  title: string;
  modelId: string;
  lastMessageAt: Timestamp;
  messageCount: number;
  isArchived: boolean;
  isPinned: boolean;
  tags?: string[];
  // STT/Audio metadata
  hasAudio?: boolean;
}

export interface Message extends BaseDocument {
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  // Audio/Biometric metadata
  audioUrl?: string; // Internal storage URL (never external)
  transcription?: string;
  tokenCount?: number;
  model?: string;
}

export interface VoicePrintMetadata extends BaseDocument {
  userId: string;
  voicePrintId: string;
  label: string; // e.g., "My Voice 1"
  isActive: boolean;
  enrollmentDate: Timestamp;
  sampleCount: number;
  // We don't store raw embeddings here to keep client lightweight, 
  // but maybe metadata about the embedding version
  modelVersion: string;
}

export type SubscriptionPlan = "free" | "plus" | "super" | "family";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export interface UserSubscription extends BaseDocument {
  userId: string;
  planId: SubscriptionPlan;
  priceId?: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: Timestamp;
  customerId?: string;
  subscriptionId?: string;
  checkoutSessionId?: string;
}

