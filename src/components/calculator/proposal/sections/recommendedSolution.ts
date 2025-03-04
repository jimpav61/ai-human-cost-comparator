
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
  const tierName = params.tierName || 'Starter Plan';
  const aiType = params.aiType || 'Text Only';
  
  // Determine the number of included minutes based on the tier
  let includedMinutes = 0;
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
  
  // Get included minutes based on tier
  if (tierKey !== 'starter') {
    includedMinutes = AI_RATES.chatbot[tierKey].includedVoiceMinutes || 600;
  }
  
  // Plan details
  let planText = `Based on your specific needs, we recommend our ${tierName}. This provides optimal functionality while maximizing your return on investment.`;
  
  // Add voice minutes information if applicable
  if (tierKey !== 'starter') {
    planText += ` The plan includes ${includedMinutes} free voice minutes per month, with additional minutes billed only if you exceed this limit.`;
  }
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  return yPosition + splitPlanText.length * 7 + 15;
};
