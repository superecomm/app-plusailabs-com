// Content item types for Profile content grid and Commerce

export type ContentType = 'text' | 'image' | 'video' | 'gallery' | 'product' | 'prompt' | 'drop' | 'post' | 'saved';

export interface MediaItem {
  url: string;
  type: 'video' | 'image';
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
  caption?: string;
  mime?: string;
}

export interface ProductData {
  price: number;
  currency: string;
  compareAt?: number;
  affiliate?: {
    url: string;
    commission: number;
    network: string;
  };
  inventory?: {
    total: number;
    available: number;
  };
  seller: {
    userId: string;
    handle: string;
    displayName: string;
  };
}

export interface DropData {
  launchDate: Date;
  expiresAt: Date;
  limitedEdition: boolean;
  soldCount: number;
}

export interface AIContext {
  category?: string;
  bestFor?: string[];
  prosCons?: string[];
  comparableTo?: string[];
  searchKeywords?: string[];
}

export interface ContentStats {
  views: number;
  saves: number;
  purchases?: number;
  revenue?: number;
  comments?: number;
  vibes?: {
    plus: number;
    minus: number;
    score: number;
  };
}

export interface ContentItem {
  id: string;
  ownerId: string;
  type: ContentType;
  title: string;
  body?: string;
  
  // Rich media support
  media?: {
    items: MediaItem[];
  };
  
  // Product-specific
  product?: ProductData;
  
  // Drop-specific
  drop?: DropData;
  
  // AI context
  aiContext?: AIContext;
  
  // Legacy/source tracking
  source?: {
    conversationId?: string;
    messageId?: string;
    exploreId?: string;
  };
  
  visibility: 'private' | 'public' | 'unlisted';
  tags: string[];
  
  // Location data (optional)
  location?: {
    lat: number;
    lng: number;
    address?: string;
    placeName?: string;
    radius?: number;
  };
  
  // Engagement stats
  stats: ContentStats;
  
  createdAt: Date;
  updatedAt: Date;
}

export type ContentFilter = 'All' | 'Posts' | 'Saved' | 'Media' | 'Products';

