
import { Lead } from "@/types/leads";
import { PdfContentParams } from "./types";
import { formatCurrency } from "@/utils/formatters";
import { standardizeLeadData } from "@/utils/proposal/standardizeLeadData";

/**
 * Extract all necessary data from a lead for PDF generation
 * Now using the standardized lead data utility for consistency
 */
export function extractLeadData(lead: Lead): PdfContentParams {
  // Use the standardized data utility for consistent extraction
  const standardData = standardizeLeadData(lead);
  
  // Map the standardized data to the format needed by the PDF generator
  return {
    brandRed: '#f6522a', // Orange-red brand color
    companyName: standardData.companyName,
    contactName: standardData.contactName,
    email: standardData.email,
    phoneNumber: standardData.phoneNumber,
    industry: standardData.industry,
    website: standardData.website,
    employeeCount: standardData.employeeCount,
    aiTier: standardData.tierKey,
    aiType: standardData.aiType,
    tierName: getTierName(standardData.tierKey),
    aiTypeDisplay: getAiTypeDisplay(standardData.aiType),
    basePrice: standardData.basePrice,
    includedMinutes: standardData.includedVoiceMinutes,
    callVolume: standardData.additionalVoiceMinutes,
    additionalVoiceMinutes: standardData.additionalVoiceMinutes,
    voiceCost: standardData.voiceCost,
    totalPrice: standardData.totalMonthlyPrice,
    setupFee: standardData.setupFee,
    humanCostMonthly: standardData.humanCostMonthly,
    monthlySavings: standardData.monthlySavings,
    yearlySavings: standardData.yearlySavings,
    savingsPercentage: standardData.savingsPercentage,
    annualPlan: false, // Default to false, can be updated if needed
    formattedDate: standardData.formattedDate
  };
}

// Helper function to get tier display name
function getTierName(tierKey: string): string {
  const tierNames = {
    'starter': 'Starter Plan',
    'growth': 'Growth Plan',
    'premium': 'Premium Plan'
  };
  return tierNames[tierKey as keyof typeof tierNames] || 'Growth Plan';
}

// Helper function to get AI type display name
function getAiTypeDisplay(aiType: string): string {
  const aiTypeDisplays = {
    'chatbot': 'Text Only',
    'voice': 'Voice Only',
    'both': 'Text & Voice',
    'conversationalVoice': 'Conversational Voice',
    'both-premium': 'Text & Conversational Voice'
  };
  return aiTypeDisplays[aiType as keyof typeof aiTypeDisplays] || 'Text & Voice';
}
