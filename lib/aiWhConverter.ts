/**
 * AI Watt-hour (aiWh) Conversion Utility
 * Converts tokens and cost to aiWh units for billing display
 */

/**
 * Convert tokens to aiWh
 * Formula: 1 aiWh ≈ 1000 tokens
 */
export function tokensToAiWh(tokens: number): number {
  return tokens / 1000;
}

/**
 * Convert cost (USD) to aiWh
 * Formula: $0.01 = 1 aiWh (or adjust based on pricing strategy)
 */
export function costToAiWh(costUSD: number): number {
  return costUSD * 100; // $0.01 = 1 aiWh
}

/**
 * Get monthly aiWh allowance based on subscription plan
 */
export function getPlanAiWhAllowance(planId: string): number {
  switch (planId) {
    case "plus":
      return 200; // 200 aiWh/month
    case "super":
      return 500; // 500 aiWh/month
    case "family":
      return 300; // 300 aiWh/month (placeholder)
    case "free":
    default:
      return 50; // 50 aiWh/month
  }
}

/**
 * Convert usage summary to aiWh consumption
 * Uses both token count and cost for more accurate conversion
 */
export function usageToAiWh(tokens: number, costUSD: number): number {
  // Use the higher of token-based or cost-based conversion
  // This ensures accuracy regardless of model pricing
  const tokenBased = tokensToAiWh(tokens);
  const costBased = costToAiWh(costUSD);
  
  // Return average for balanced representation
  return (tokenBased + costBased) / 2;
}

