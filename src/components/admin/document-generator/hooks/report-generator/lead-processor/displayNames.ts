
import { getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";

/**
 * Gets formatted display names for tier and AI type
 */
export function getDisplayNames(tierKey: string, aiType: string) {
  // Get display names for tier and AI type
  const tierName = getTierDisplayName(tierKey);
  const aiTypeDisplay = getAITypeDisplay(aiType);
  
  return { tierName, aiType: aiTypeDisplay };
}
