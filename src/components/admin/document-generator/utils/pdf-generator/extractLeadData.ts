
import { Lead } from "@/types/leads";
import { PdfContentParams } from "./types";
import { formatCurrency } from "@/utils/formatters";
import { standardizeLeadData } from "@/utils/proposal/standardizeLeadData";
import { calculatePlanPrice } from "../../components/edit-proposal/calculatePlanPrice";

/**
 * Extract all necessary data from a lead for PDF generation
 * Now using the standardized lead data utility for consistency and ensuring
 * edited values are properly used
 */
export function extractLeadData(lead: Lead): PdfContentParams {
  // Use the standardized data utility for consistent extraction
  const standardData = standardizeLeadData(lead);
  
  // CRITICAL FIX: Ensure we have the latest tier and voice minutes values
  // First, get the tier from the most recent inputs
  const tierKey = (lead.calculator_inputs?.aiTier || standardData.tierKey || 'growth') as 'starter' | 'growth' | 'premium';
  
  // Get the additional voice minutes - prioritize calculator_inputs value
  let additionalVoiceMinutes = 0;
  
  if (typeof lead.calculator_inputs?.callVolume === 'number') {
    additionalVoiceMinutes = lead.calculator_inputs.callVolume;
  } else if (typeof lead.calculator_inputs?.callVolume === 'string' && lead.calculator_inputs.callVolume !== '') {
    additionalVoiceMinutes = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
  } else if (typeof standardData.additionalVoiceMinutes === 'number') {
    additionalVoiceMinutes = standardData.additionalVoiceMinutes;
  }
  
  // Force additionalVoiceMinutes to 0 for starter plan
  if (tierKey === 'starter') {
    additionalVoiceMinutes = 0;
  }
  
  // Now recalculate pricing based on the current tier and voice minutes
  const pricing = calculatePlanPrice(tierKey, additionalVoiceMinutes);
  
  // Ensure we have the correct pricing values based on tier
  const basePrice = pricing.basePrice;
  const setupFee = pricing.setupFee;
  const voiceCost = pricing.voiceCost;
  const totalPrice = pricing.totalPrice;
  
  // Log for debugging
  console.log("PDF Generation - Extracting data with recalculated pricing:", {
    tierKey,
    additionalVoiceMinutes,
    basePrice,
    setupFee,
    voiceCost,
    totalPrice
  });
  
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
    aiTier: tierKey,
    aiType: standardData.aiType,
    tierName: getTierName(tierKey),
    aiTypeDisplay: getAiTypeDisplay(standardData.aiType),
    basePrice: basePrice,
    includedMinutes: tierKey === 'starter' ? 0 : 600,
    callVolume: additionalVoiceMinutes,
    additionalVoiceMinutes: additionalVoiceMinutes,
    voiceCost: voiceCost,
    totalPrice: totalPrice,
    setupFee: setupFee,
    humanCostMonthly: standardData.humanCostMonthly,
    monthlySavings: standardData.humanCostMonthly - totalPrice,
    yearlySavings: (standardData.humanCostMonthly - totalPrice) * 12,
    savingsPercentage: Math.round((standardData.humanCostMonthly - totalPrice) / standardData.humanCostMonthly * 100),
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
