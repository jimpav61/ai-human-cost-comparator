
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { getTierDisplayName, getAITypeDisplay } from '@/components/calculator/pricingDetailsCalculator';
import { AI_RATES } from '@/constants/pricing';

export const addRecommendedSolution = (doc: JsPDFWithAutoTable, yPosition: number, params: SectionParams): number => {
  // Recommended Solution
  doc.setFontSize(16);
  doc.setTextColor(246, 82, 40); // Brand color for section header (f65228)
  doc.text("Recommended Solution", 20, yPosition);
  
  yPosition += 8;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Regular text in black
  
  // Get tier name and AI type from params or determine based on input values
  const tierName = params.tierName || getTierDisplayName(params.results?.tierKey || 'starter');
  const aiType = params.aiType || getAITypeDisplay(params.results?.aiType || 'chatbot');
  
  // Determine the tier key for pricing
  let tierKey = 'starter';
  
  if (params.results?.tierKey) {
    // Get the tier from the results
    tierKey = params.results.tierKey;
  } else if (params.tierName) {
    // Extract tier from tier name if available
    const tierLower = params.tierName.toLowerCase();
    if (tierLower.includes('premium')) {
      tierKey = 'premium';
    } else if (tierLower.includes('growth')) {
      tierKey = 'growth';
    }
  }
  
  // Get the exact base price for this tier
  const basePrice = AI_RATES.chatbot[tierKey].base || 0;
  
  // Get included minutes based on tier
  const includedMinutes = tierKey !== 'starter' 
    ? AI_RATES.chatbot[tierKey].includedVoiceMinutes || 0 
    : 0;
  
  // Plan details with AI type info
  let planText = `Based on your specific needs, we recommend our ${tierName} with ${aiType} capabilities for $${basePrice}/month. This provides optimal functionality while maximizing your return on investment.`;
  
  // Add voice minutes information if applicable
  if (tierKey !== 'starter' && (aiType.includes('Voice') || aiType.includes('voice'))) {
    planText += ` The plan includes ${includedMinutes} free voice minutes per month, with additional minutes billed only if you exceed this limit.`;
  }
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  return yPosition + splitPlanText.length * 7 + 15;
};
