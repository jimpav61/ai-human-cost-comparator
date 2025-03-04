
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
  if (params.results?.aiCostMonthly) {
    // Get the tier from the results
    const tierKey = params.results.tierKey || 'starter';
    if (tierKey in AI_RATES.chatbot) {
      includedMinutes = AI_RATES.chatbot[tierKey].includedVoiceMinutes || 0;
    }
  } else if (params.tierName) {
    // Extract tier from tier name if available
    const tierLower = params.tierName.toLowerCase();
    if (tierLower.includes('premium')) {
      includedMinutes = AI_RATES.chatbot.premium.includedVoiceMinutes || 600;
    } else if (tierLower.includes('growth')) {
      includedMinutes = AI_RATES.chatbot.growth.includedVoiceMinutes || 600;
    }
  }
  
  // Plan details
  let planText = `Based on your specific needs, we recommend our ${tierName}. This provides optimal functionality while maximizing your return on investment. The plan includes ${includedMinutes} free voice minutes per month.`;
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  return yPosition + splitPlanText.length * 7 + 15;
};
