
import { Lead } from "@/types/leads";

/**
 * Standardized interface for proposal data
 * This ensures consistent structure regardless of data source
 */
export interface StandardizedProposalData {
  // Lead identification
  leadId: string;
  
  // Contact information
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  website: string;
  industry: string;
  employeeCount: number;
  
  // Plan configuration 
  tierKey: 'starter' | 'growth' | 'premium';
  aiType: string;
  
  // Voice minutes
  includedVoiceMinutes: number;
  additionalVoiceMinutes: number;
  
  // Pricing information
  basePrice: number;
  voiceRate: number;
  voiceCost: number;
  setupFee: number;
  totalMonthlyPrice: number;
  
  // ROI metrics
  humanCostMonthly: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  breakEvenMonths: number;
  
  // Metadata
  formattedDate: string;
  version: number;
}

/**
 * Standardizes lead data for proposal generation
 * Creates a consistent data format regardless of the source
 * 
 * @param lead The lead data from any source
 * @returns A standardized data object for proposal generation
 */
export function standardizeLeadData(lead: Lead): StandardizedProposalData {
  console.log("Standardizing lead data for proposals:", lead.id);
  
  // 1. Extract and validate tier information
  const tierKey = extractTierKey(lead);
  
  // 2. Extract and validate AI type
  const aiType = extractAiType(lead);
  
  // 3. Extract and normalize voice minutes
  const { includedVoiceMinutes, additionalVoiceMinutes } = extractVoiceMinutes(lead, tierKey);
  
  // 4. Extract or calculate pricing information
  const { basePrice, voiceRate, setupFee } = extractPricing(tierKey);
  
  // 5. Calculate derived values
  const voiceCost = calculateVoiceCost(additionalVoiceMinutes, voiceRate);
  const totalMonthlyPrice = basePrice + voiceCost;
  
  // 6. Extract or calculate ROI metrics
  const { 
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    breakEvenMonths
  } = extractRoiMetrics(lead, totalMonthlyPrice, setupFee);
  
  // 7. Format date for the proposal
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // 8. Get version information if available
  // Fix: Check for version_info in a type-safe way using optional chaining and type assertion
  const version = (lead as any).version_info?.version_number || 1;
  
  // Return the complete standardized data object
  return {
    leadId: lead.id,
    
    companyName: lead.company_name || 'Your Company',
    contactName: lead.name || 'Valued Customer',
    email: lead.email || 'email@example.com',
    phoneNumber: lead.phone_number || '',
    website: lead.website || '',
    industry: lead.industry || '',
    employeeCount: lead.employee_count || 5,
    
    tierKey,
    aiType,
    
    includedVoiceMinutes,
    additionalVoiceMinutes,
    
    basePrice,
    voiceRate,
    voiceCost,
    setupFee,
    totalMonthlyPrice,
    
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    breakEvenMonths,
    
    formattedDate,
    version
  };
}

/**
 * Extract tier key, handling all the different ways it might be stored
 */
function extractTierKey(lead: Lead): 'starter' | 'growth' | 'premium' {
  // First check calculator inputs
  const inputTier = lead.calculator_inputs?.aiTier;
  if (inputTier === 'starter' || inputTier === 'growth' || inputTier === 'premium') {
    return inputTier;
  }
  
  // Then check calculator results
  const resultsTier = lead.calculator_results?.tierKey;
  if (resultsTier === 'starter' || resultsTier === 'growth' || resultsTier === 'premium') {
    return resultsTier;
  }
  
  // Default to growth if not found
  return 'growth';
}

/**
 * Extract AI type, handling various data sources
 */
function extractAiType(lead: Lead): string {
  // First check calculator inputs
  const inputAiType = lead.calculator_inputs?.aiType;
  if (inputAiType) {
    return inputAiType;
  }
  
  // Then check calculator results
  const resultsAiType = lead.calculator_results?.aiType;
  if (resultsAiType) {
    return resultsAiType;
  }
  
  // Default to both if not found
  return 'both';
}

/**
 * Extract voice minutes information, ensuring consistent types
 */
function extractVoiceMinutes(lead: Lead, tierKey: string) {
  // Included minutes based on tier
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  
  // For starter tier, always force additional minutes to 0
  if (tierKey === 'starter') {
    return { includedVoiceMinutes: 0, additionalVoiceMinutes: 0 };
  }
  
  let additionalVoiceMinutes = 0;
  
  // Try to get from calculator inputs first (most accurate)
  if (lead.calculator_inputs?.callVolume !== undefined) {
    const callVolume = lead.calculator_inputs.callVolume;
    if (typeof callVolume === 'number') {
      additionalVoiceMinutes = callVolume;
    } else if (typeof callVolume === 'string') {
      additionalVoiceMinutes = parseInt(callVolume, 10) || 0;
    }
  }
  // Fall back to calculator results if inputs don't have it
  else if (lead.calculator_results?.additionalVoiceMinutes !== undefined) {
    const resultMinutes = lead.calculator_results.additionalVoiceMinutes;
    if (typeof resultMinutes === 'number') {
      additionalVoiceMinutes = resultMinutes;
    } else if (typeof resultMinutes === 'string') {
      additionalVoiceMinutes = parseInt(resultMinutes, 10) || 0;
    }
  }
  
  return { includedVoiceMinutes, additionalVoiceMinutes };
}

/**
 * Extract pricing information based on tier
 */
function extractPricing(tierKey: string) {
  // Fixed base prices per tier
  const basePriceByTier = {
    starter: 99,
    growth: 229,
    premium: 429
  };
  const basePrice = basePriceByTier[tierKey as keyof typeof basePriceByTier];
  
  // Fixed setup fees per tier
  const setupFeeByTier = {
    starter: 249,
    growth: 749,
    premium: 1149
  };
  const setupFee = setupFeeByTier[tierKey as keyof typeof setupFeeByTier];
  
  // Voice rate is always 0.12 per minute (except starter which has no voice)
  const voiceRate = tierKey === 'starter' ? 0 : 0.12;
  
  return { basePrice, setupFee, voiceRate };
}

/**
 * Calculate voice cost based on minutes and rate
 */
function calculateVoiceCost(additionalVoiceMinutes: number, voiceRate: number): number {
  return additionalVoiceMinutes * voiceRate;
}

/**
 * Extract or calculate ROI metrics
 */
function extractRoiMetrics(lead: Lead, totalMonthlyPrice: number, setupFee: number) {
  // Get human cost or use default
  const humanCostMonthly = typeof lead.calculator_results?.humanCostMonthly === 'number' ?
    lead.calculator_results.humanCostMonthly : 3800;
  
  // Calculate savings
  const monthlySavings = humanCostMonthly - totalMonthlyPrice;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCostMonthly > 0 ? Math.round((monthlySavings / humanCostMonthly) * 100) : 0;
  
  // Calculate break-even point
  const breakEvenMonths = monthlySavings > 0 ? Math.ceil(setupFee / monthlySavings) : 0;
  
  return {
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    breakEvenMonths
  };
}
