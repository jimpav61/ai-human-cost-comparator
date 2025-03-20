
/**
 * Calculates pricing details based on plan tier and additional voice minutes
 */
export function calculatePlanPrice(tier: "starter" | "growth" | "premium", callVolume: number = 0) {
  // Base prices for each tier
  const basePrices = {
    starter: 99,
    growth: 229,
    premium: 429
  };
  
  // Setup fees for each tier
  const setupFees = {
    starter: 249,
    growth: 749,
    premium: 1149
  };
  
  // Calculate voice cost (0 for starter tier)
  const voiceCost = tier === 'starter' ? 0 : callVolume * 0.12;
  
  // Get base price for selected tier
  const basePrice = basePrices[tier] || 229;
  
  // Get setup fee for selected tier
  const setupFee = setupFees[tier] || 749;
  
  // Calculate total monthly price
  const totalPrice = basePrice + voiceCost;
  
  return {
    basePrice,
    voiceCost,
    totalPrice,
    setupFee
  };
}
