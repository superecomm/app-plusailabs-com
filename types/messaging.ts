import { Timestamp } from "firebase/firestore";

export interface MessageThread {
  id: string;
  participants: string[];
  participantData: {
    [userId: string]: {
      handle: string;
      displayName: string;
      photoURL?: string;
    };
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  lastReadAt: {
    [userId: string]: Date;
  };
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Date;
  updatedAt: Date;
  archived?: {
    [userId: string]: boolean;
  };
}

export interface DirectMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  editedAt?: Date;
  deleted?: boolean;
  deletedBy?: string[];
}

export interface MessagingSettings {
  allowMessagesFrom: 'everyone' | 'following' | 'none';
  muteAll: boolean;
  mutedThreads: string[];
  blockedUsers: string[];
  notificationsEnabled: boolean;
}

