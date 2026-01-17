/**
 * Tool Registry - Defines available tools for LLM function calling
 */

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_explore",
      description: "Search the explore feed for products, videos, and content. Use this when users ask about products, content, or want recommendations.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query or keywords to find content"
          },
          filter: {
            type: "string",
            enum: ["for-you", "products", "videos", "trending"],
            description: "Filter by content type"
          },
          maxResults: {
            type: "number",
            default: 10,
            description: "Maximum number of results to return"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get detailed information about a specific product by ID. Use this when user asks about a specific product.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "The ID of the product to get details for"
          }
        },
        required: ["productId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_nearby",
      description: "Find content, products, or places near the user's location. Use this when users ask about nearby places, local content, or location-based recommendations.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["product", "video", "all"],
            description: "Filter by content type"
          },
          radius: {
            type: "number",
            default: 5,
            description: "Search radius in miles"
          },
          keywords: {
            type: "string",
            description: "Optional keywords to search for"
          }
        }
      }
    }
  }
];

export function getToolsForModel(modelId: string): ToolDefinition[] {
  // All models get all tools for now
  // In future, we can filter based on model capabilities
  return TOOLS;
}

