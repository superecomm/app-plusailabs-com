/**
 * AI Product Intelligence
 * Helps +AI understand, compare, and recommend products
 */

import type { ContentItem } from "@/types/content";

/**
 * Build AI context for a product
 */
export function buildProductContext(product: ContentItem): string {
  if (!product.product) return '';
  
  const context = [`
Product: ${product.title}
Price: $${product.product.price} ${product.product.currency || 'USD'}
Seller: @${product.product.seller.handle}
`];
  
  if (product.body) {
    context.push(`Description: ${product.body}`);
  }
  
  if (product.aiContext?.category) {
    context.push(`Category: ${product.aiContext.category}`);
  }
  
  if (product.aiContext?.bestFor) {
    context.push(`Best for: ${product.aiContext.bestFor.join(', ')}`);
  }
  
  if (product.aiContext?.prosCons) {
    context.push(`Key points: ${product.aiContext.prosCons.join(', ')}`);
  }
  
  if (product.product.compareAt) {
    const savings = product.product.compareAt - product.product.price;
    const percent = ((savings / product.product.compareAt) * 100).toFixed(0);
    context.push(`Deal: ${percent}% off (was $${product.product.compareAt})`);
  }
  
  return context.join('\n');
}

/**
 * Detect if user message is a product query
 */
export function isProductQuery(message: string): boolean {
  const patterns = [
    /show me|find|recommend|suggest/i,
    /best.*for|good.*for/i,
    /compare|vs|versus/i,
    /cheaper|better|alternative/i,
    /worth it|should i buy/i,
    /deal|sale|discount/i,
  ];
  
  return patterns.some(p => p.test(message));
}

/**
 * Extract product search criteria from natural language
 */
export function extractProductCriteria(message: string): {
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  keywords?: string[];
} {
  const criteria: any = {};
  
  // Price range
  const maxPriceMatch = message.match(/under \$?(\d+)/i);
  if (maxPriceMatch) {
    criteria.maxPrice = parseInt(maxPriceMatch[1]);
  }
  
  const minPriceMatch = message.match(/over \$?(\d+)|above \$?(\d+)/i);
  if (minPriceMatch) {
    criteria.minPrice = parseInt(minPriceMatch[1] || minPriceMatch[2]);
  }
  
  // Category keywords
  const categories = [
    'headphones', 'laptop', 'phone', 'book', 'course', 
    'template', 'notion', 'productivity', 'health', 'fitness',
    'camera', 'microphone', 'keyboard', 'mouse', 'monitor'
  ];
  
  const foundCategory = categories.find(c => message.toLowerCase().includes(c));
  if (foundCategory) {
    criteria.category = foundCategory;
  }
  
  // Extract other keywords
  const words = message.toLowerCase().split(/\s+/);
  criteria.keywords = words.filter(w => w.length > 3 && !['show', 'find', 'good', 'best', 'under'].includes(w));
  
  return criteria;
}

/**
 * Search products based on criteria
 */
export async function searchProducts(criteria: {
  category?: string;
  maxPrice?: number;
  minPrice?: number;
  keywords?: string[];
}): Promise<ContentItem[]> {
  try {
    const params = new URLSearchParams();
    if (criteria.category) params.append('category', criteria.category);
    if (criteria.maxPrice) params.append('maxPrice', criteria.maxPrice.toString());
    if (criteria.minPrice) params.append('minPrice', criteria.minPrice.toString());
    if (criteria.keywords) params.append('keywords', criteria.keywords.join(','));
    
    const response = await fetch(`/api/products/search?${params.toString()}`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.products || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Calculate if a product is a good deal
 */
export function calculateDealScore(product: ContentItem): {
  isDeal: boolean;
  savings: number;
  percent: number;
} | null {
  if (!product.product?.compareAt) return null;
  
  const savings = product.product.compareAt - product.product.price;
  const percent = (savings / product.product.compareAt) * 100;
  
  return {
    isDeal: percent >= 15, // 15%+ off = deal
    savings,
    percent,
  };
}

