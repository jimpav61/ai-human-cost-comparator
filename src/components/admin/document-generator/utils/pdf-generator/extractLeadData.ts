
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
  
  // UPDATED LOGIC: PRIMARY SOURCE OF TRUTH IS CALCULATOR_INPUTS
  // This is what the user most recently edited in the UI
  const tierKey = lead.calculator_inputs?.aiTier || results.tierKey || 'growth';
  const aiType = lead.calculator_inputs?.aiType || results.aiType || 'both';
  
  console.log("Using tier and type from inputs:", { tierKey, aiType });
  
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
  
  // Get pricing information - use calculator_inputs as source of truth for tier
  const basePrices = {
    'starter': 99,
    'growth': 229,
    'premium': 429
  };
  const basePrice = basePrices[tierKey as keyof typeof basePrices] || results.basePriceMonthly || 229;
  
  const setupFees = {
    'starter': 249,
    'growth': 749,
    'premium': 1149
  };
  const setupFee = setupFees[tierKey as keyof typeof setupFees] || results.aiCostMonthly?.setupFee || 749;
  
  // CRITICAL: Get voice minutes and properly calculate voice costs
  let additionalVoiceMinutes = 0;
  
  // First check if tier is starter - in this case force to 0 voice minutes
  if (tierKey === 'starter') {
    additionalVoiceMinutes = 0;
    console.log("Starter tier selected, setting additionalVoiceMinutes to 0");
  }
  // Next try calculator_inputs.callVolume (direct user input)
  else if (lead.calculator_inputs?.callVolume !== undefined) {
    if (typeof lead.calculator_inputs.callVolume === 'number') {
      additionalVoiceMinutes = lead.calculator_inputs.callVolume;
    } else if (typeof lead.calculator_inputs.callVolume === 'string') {
      additionalVoiceMinutes = parseInt(lead.calculator_inputs.callVolume, 10) || 0;
    }
    console.log("Using callVolume from calculator_inputs:", additionalVoiceMinutes);
  } 
  // Then try results.additionalVoiceMinutes (might have been calculated)
  else if (results.additionalVoiceMinutes !== undefined) {
    additionalVoiceMinutes = results.additionalVoiceMinutes;
    console.log("Using additionalVoiceMinutes from results:", additionalVoiceMinutes);
  }

  // Calculate included minutes based on tier
  const includedMinutes = tierKey === 'starter' ? 0 : 600;
  
  // Calculate voice cost based on tier and additionalVoiceMinutes
  // For starter tier, voice cost is always 0
  const voiceRate = {
    'starter': 0,
    'growth': 0.12,
    'premium': 0.12
  };
  const rate = voiceRate[tierKey as keyof typeof voiceRate] || 0.12;
  const voiceCost = tierKey === 'starter' ? 0 : (additionalVoiceMinutes * rate);
  
  // Calculate total price based on tier and voice minutes
  const totalPrice = basePrice + voiceCost;
  
  // Get savings information - recalculate if needed
  const humanCostMonthly = results.humanCostMonthly || 3800;
  const monthlySavings = results.monthlySavings || (humanCostMonthly - totalPrice);
  const yearlySavings = results.yearlySavings || (monthlySavings * 12);
  const savingsPercentage = results.savingsPercentage || 
    (humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 0);
  
  // Format date for proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  
  // Log the extracted data for debugging
  console.log("Extracted PDF params:", {
    tierKey,
    aiType,
    basePrice,
    additionalVoiceMinutes,
    voiceCost,
    totalPrice,
    setupFee,
    includedMinutes
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
