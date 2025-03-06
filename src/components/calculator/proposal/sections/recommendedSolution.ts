
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { getTierDisplayName, getAITypeDisplay } from '@/components/calculator/pricingDetailsCalculator';
import { AI_RATES } from '@/constants/pricing';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { SharedResults } from '../../shared/types';

export const addRecommendedSolution = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  // Recommended Solution section header
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header (f65228)
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Regular text in black
  
  // Get tier name and AI type display names
  // First try to get from SharedResults, then fall back to params
  let tierKey = '';
  let aiTypeKey = '';
  
  // Safely access tierKey and aiType from results if available
  if (params.results) {
    const sharedResults = params.results as SharedResults;
    tierKey = sharedResults.tierKey || '';
    aiTypeKey = sharedResults.aiType || '';
  }
  
  // If not available from results, extract from params.tierName
  if (!tierKey && params.tierName) {
    tierKey = params.tierName.toLowerCase().includes('starter') ? 'starter' : 
              params.tierName.toLowerCase().includes('growth') ? 'growth' : 
              params.tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
  }
  
  // If not available from results, extract from params.aiType
  if (!aiTypeKey && params.aiType) {
    aiTypeKey = params.aiType.toLowerCase().includes('text only') ? 'chatbot' :
                params.aiType.toLowerCase().includes('voice') ? 'voice' : 'chatbot';
  }
  
  const tierName = params.tierName || getTierDisplayName(tierKey);
  const aiType = params.aiType || getAITypeDisplay(aiTypeKey);
  
  // Get exact fixed price for the tier - always use hardcoded values
  const basePrice = getTierBasePrice(tierKey);
  
  // Get included minutes based on tier
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  
  // Get additional voice minutes and calculate correct cost
  const additionalVoiceMinutes = params.additionalVoiceMinutes || 0;
  
  console.log("Recommended Solution - Voice minutes:", {
    tier: tierKey,
    additionalVoiceMinutes,
    includedVoiceMinutes
  });
  
  // Calculate cost only for minutes beyond the included amount
  const chargeableMinutes = Math.max(0, additionalVoiceMinutes - includedVoiceMinutes);
  const additionalVoiceCost = chargeableMinutes * 0.12;
  const totalCost = basePrice + additionalVoiceCost;
  
  // Create plan description based on tier and AI type
  let planText = `Based on your specific needs, we recommend our ${tierName} with ${aiType} capabilities for ${formatCurrency(basePrice)}/month. This provides optimal functionality while maximizing your return on investment.`;
  
  // Add voice minutes information if applicable
  if (includedVoiceMinutes > 0 && (aiType.toLowerCase().includes('voice'))) {
    planText += ` The plan includes ${formatNumber(includedVoiceMinutes)} free voice minutes per month, with additional minutes billed at 12¢ per minute only if you exceed this limit.`;
  }
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  yPosition += splitPlanText.length * 7 + 8;
  
  // If there are additional voice minutes, add that information
  if (additionalVoiceMinutes > 0) {
    let additionalText;
    
    if (additionalVoiceMinutes <= includedVoiceMinutes) {
      // If all minutes are covered by the included amount
      additionalText = `Your proposal includes ${formatNumber(additionalVoiceMinutes)} voice minutes, which are fully covered by your ${tierName}'s included minutes. No additional cost for voice minutes.`;
    } else {
      // If there are minutes beyond the included amount
      additionalText = `Your proposal includes ${formatNumber(additionalVoiceMinutes)} voice minutes (${formatNumber(includedVoiceMinutes)} included in your plan + ${formatNumber(chargeableMinutes)} additional minutes at a cost of ${formatCurrency(additionalVoiceCost)}/month), making your total monthly cost ${formatCurrency(totalCost)}.`;
    }
    
    const splitAdditionalText = doc.splitTextToSize(additionalText, 170);
    doc.text(splitAdditionalText, 20, yPosition);
    yPosition += splitAdditionalText.length * 7 + 8;
  }
  
  return yPosition + 7;
};

// Helper function to get exact base price for each tier
const getTierBasePrice = (tierKey: string): number => {
  switch (tierKey) {
    case 'premium':
      return 429;
    case 'growth':
      return 229;
    case 'starter':
    default:
      return 99;
  }
};
