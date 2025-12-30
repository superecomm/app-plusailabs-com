export interface Comment {
  id: string;
  contentId: string;
  userId: string;
  userHandle: string;
  userDisplayName: string;
  userPhoto?: string;
  text: string;
  
  // Vibe (for product reviews)
  vibe?: '+' | '-';
  verified?: boolean;          // Verified purchase
  
  // Engagement
  vibes: {
    plus: number;
    minus: number;
    score: number;             // plus - minus
  };
  
  // Track who vibed
  vibeHistory: {
    [userId: string]: '+' | '-';
  };
  
  createdAt: Date;
  editedAt?: Date;
  deleted?: boolean;
}

export interface VibeData {
  plus: number;
  minus: number;
  score: number;
  userVibe?: '+' | '-' | null;
}

