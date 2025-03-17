
import { Lead } from "@/types/leads";
import { PdfContentParams } from "./types";
import { formatCurrency } from "@/utils/formatters";

/**
 * Extract all necessary data from a lead for PDF generation
 */
export function extractLeadData(lead: Lead): PdfContentParams {
  console.log("Extracting lead data for PDF generation:", {
    leadId: lead.id,
    calculator_inputs: lead.calculator_inputs,
    calculator_results: lead.calculator_results
  });

  // Default values
  const defaultResults = {
    tierKey: 'growth',
    aiType: 'both',
    basePriceMonthly: 229,
    humanCostMonthly: 3800,
    monthlySavings: 3571,
    yearlySavings: 42852,
    savingsPercentage: 94,
    aiCostMonthly: {
      voice: 0,
      chatbot: 229,
      total: 229,
      setupFee: 749
    },
    annualPlan: 2290,
    includedVoiceMinutes: 600,
    additionalVoiceMinutes: 0
  };

  // Use calculator_results if available, otherwise use defaults
  const results = lead.calculator_results || defaultResults;
  
  // Extract AI tier and type information
  const tierKey = results.tierKey || 'growth';
  const aiType = results.aiType || 'both';
  
  // Get tier and AI type display names
  const tierNames = {
    'starter': 'Starter Plan',
    'growth': 'Growth Plan', 
    'premium': 'Premium Plan'
  };
  const tierName = tierNames[tierKey as keyof typeof tierNames] || 'Growth Plan';
  
  // Get AI type display name
  const aiTypeDisplays = {
    'chatbot': 'Text Only',
    'voice': 'Voice Only',
    'both': 'Text & Voice',
    'conversationalVoice': 'Conversational Voice',
    'both-premium': 'Text & Conversational Voice'
  };
  const aiTypeDisplay = aiTypeDisplays[aiType as keyof typeof aiTypeDisplays] || 'Text & Voice';
  
  // Get pricing information
  const basePrice = results.basePriceMonthly || 229;
  const setupFee = results.aiCostMonthly?.setupFee || 749;
  
  // CRITICAL: Get voice minutes from multiple possible sources to ensure we have accurate data
  // First try calculator_inputs.callVolume (direct user input)
  let additionalVoiceMinutes = 0;
  if (lead.calculator_inputs?.callVolume) {
    if (typeof lead.calculator_inputs.callVolume === 'number') {
      additionalVoiceMinutes = lead.calculator_inputs.callVolume;
    } else if (typeof lead.calculator_inputs.callVolume === 'string') {
      additionalVoiceMinutes = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
    }
  } 
  // Then try results.additionalVoiceMinutes (might have been calculated)
  else if ('additionalVoiceMinutes' in results && typeof results.additionalVoiceMinutes === 'number') {
    additionalVoiceMinutes = results.additionalVoiceMinutes;
  }
  // Finally, calculate voice cost directly from results if available
  const voiceCost = results.aiCostMonthly?.voice || (additionalVoiceMinutes > 0 ? additionalVoiceMinutes * 0.12 : 0);
  const totalPrice = basePrice + voiceCost;
  
  // Get savings information
  const humanCostMonthly = results.humanCostMonthly || 3800;
  const monthlySavings = results.monthlySavings || (humanCostMonthly - totalPrice);
  const yearlySavings = results.yearlySavings || (monthlySavings * 12);
  const savingsPercentage = results.savingsPercentage || 
    (humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 0);
  
  // Format date for proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  
  const includedMinutes = tierKey === 'starter' ? 0 : 600;
  
  // Log the extracted data for debugging
  console.log("Extracted PDF params:", {
    tierKey,
    aiType,
    basePrice,
    additionalVoiceMinutes,
    voiceCost,
    totalPrice
  });

  return {
    brandRed: '#f6522a', // Orange-red brand color
    companyName: lead.company_name || 'Your Company',
    contactName: lead.name || 'Valued Customer',
    email: lead.email || 'email@example.com',
    phoneNumber: lead.phone_number || 'Not provided',
    industry: lead.industry || 'Technology',
    website: lead.website || 'Not provided',
    employeeCount: lead.employee_count || 5,
    aiTier: tierKey,
    aiType: aiType,
    tierName: tierName,
    aiTypeDisplay: aiTypeDisplay,
    basePrice: basePrice,
    includedMinutes: includedMinutes,
    callVolume: additionalVoiceMinutes,
    additionalVoiceMinutes: additionalVoiceMinutes,
    voiceCost: voiceCost,
    totalPrice: totalPrice,
    setupFee: setupFee,
    humanCostMonthly: humanCostMonthly,
    monthlySavings: monthlySavings,
    yearlySavings: yearlySavings,
    savingsPercentage: savingsPercentage,
    annualPlan: !!results.annualPlan,
    formattedDate: formattedDate
  };
}
