
import { JsPDFWithAutoTable, SectionParams } from '../types';
import { getTierDisplayName, getAITypeDisplay } from '@/components/calculator/pricingDetailsCalculator';
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
  
  // Determine the correct AI capability display based on the tier
  let displayAIType = params.aiType || getAITypeDisplay(aiTypeKey);
  
  // Ensure Growth plan always shows with voice capabilities
  if (tierKey === 'growth' && displayAIType === 'Text Only') {
    displayAIType = 'Text & Basic Voice';
  }
  
  // Premium plan should always include conversational voice
  if (tierKey === 'premium' && (displayAIType === 'Text Only' || displayAIType === 'Text & Basic Voice')) {
    displayAIType = 'Text & Conversational Voice';
  }
  
  const tierName = params.tierName || getTierDisplayName(tierKey);
  
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
  
  // Calculate cost for additional minutes
  const additionalVoiceCost = additionalVoiceMinutes * 0.12;
  const totalCost = basePrice + additionalVoiceCost;
  
  // Create plan description based on tier and AI type
  let planText = `Based on your specific needs, we recommend our ${tierName} with ${displayAIType} capabilities for ${formatCurrency(basePrice)}/month. This provides optimal functionality while maximizing your return on investment.`;
  
  // Add voice minutes information if applicable
  if (includedVoiceMinutes > 0 && tierKey !== 'starter') {
    planText += ` The plan includes ${formatNumber(includedVoiceMinutes)} free voice minutes per month, with additional minutes billed at 12¢ per minute.`;
  }
  
  const splitPlanText = doc.splitTextToSize(planText, 170);
  doc.text(splitPlanText, 20, yPosition);
  
  yPosition += splitPlanText.length * 7 + 8;
  
  // If there are additional voice minutes, add that information in a highlighted section
  if (additionalVoiceMinutes > 0) {
    // Draw a light background for the additional minutes section
    doc.setFillColor(245, 245, 245);
    doc.rect(20, yPosition - 3, 170, 20, 'F');
    
    // Add clear information about the additional minutes
    doc.setFont(undefined, 'bold');
    doc.text("Additional Voice Minutes:", 25, yPosition + 5);
    doc.setFont(undefined, 'normal');
    
    let minutesText = `${formatNumber(additionalVoiceMinutes)} additional minutes at 12¢ per minute = ${formatCurrency(additionalVoiceCost)}/month`;
    doc.text(minutesText, 95, yPosition + 5);
    
    // Add the total monthly cost on a new line
    doc.setFont(undefined, 'bold');
    doc.text("Total Monthly Cost:", 25, yPosition + 14);
    doc.text(formatCurrency(totalCost) + "/month", 95, yPosition + 14);
    doc.setFont(undefined, 'normal');
    
    yPosition += 25;
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
