
import { 
  formatPdfCurrency, 
  formatPdfPercentage, 
  getPlanName, 
  getAiTypeDisplay,
  ensureNumber,
  ensureString,
  debugLog
} from "./pdf-utils.ts";

export interface ProposalData {
  // Company and contact info
  brandRed: string;
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  employeeCount: number;
  
  // Plan details
  tierKey: string;
  tierName: string;
  aiType: string;
  aiTypeDisplay: string;
  includedVoiceMinutes: number;
  additionalVoiceMinutes: number;
  
  // Financial details
  humanCostMonthly: number;
  basePrice: number;
  setupFee: number;
  voiceCost: number;
  totalMonthlyCost: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  breakEvenMonths: number;
  firstYearROI: number;
  fiveYearSavings: number;
  
  // Formatting
  formattedDate: string;
  
  // Formatted values for display
  formattedHumanCost: string;
  formattedBasePrice: string;
  formattedSetupFee: string;
  formattedVoiceCost: string;
  formattedTotalCost: string;
  formattedMonthlySavings: string;
  formattedYearlySavings: string;
  formattedSavingsPercentage: string;
}

/**
 * Extract all necessary data from lead object to generate a proposal PDF
 * Using a standardized approach that handles all input variations
 */
export function extractProposalData(lead: any): ProposalData {
  debugLog("Lead Object for Extraction", {
    id: lead.id,
    company: lead.company_name,
    contact: lead.name
  });
  
  // Enhanced debug logging
  debugLog("Calculator Data Available", {
    hasCalculatorInputs: !!lead.calculator_inputs,
    hasCalculatorResults: !!lead.calculator_results,
    inputKeys: lead.calculator_inputs ? Object.keys(lead.calculator_inputs) : [],
    resultKeys: lead.calculator_results ? Object.keys(lead.calculator_results) : []
  });
  
  // Ensure calculator_results exists and is an object
  const calculatorResults = lead.calculator_results || {};
  const calculatorInputs = lead.calculator_inputs || {};
  
  // Log key values for debugging
  debugLog("Key Calculator Values", {
    inputs_aiTier: calculatorInputs.aiTier,
    results_tierKey: calculatorResults.tierKey,
    inputs_aiType: calculatorInputs.aiType,
    results_aiType: calculatorResults.aiType,
    inputs_callVolume: calculatorInputs.callVolume,
    results_additionalVoiceMinutes: calculatorResults.additionalVoiceMinutes
  });
  
  // Extract company and contact information with defaults
  const companyName = ensureString(lead.company_name, 'Your Company');
  const contactName = ensureString(lead.name, 'Valued Client');
  const email = ensureString(lead.email, 'client@example.com');
  const phoneNumber = ensureString(lead.phone_number, 'Not provided');
  const industry = ensureString(lead.industry, 'Technology');
  const employeeCount = ensureNumber(lead.employee_count, 5);
  
  // CRITICAL FIX: Always prioritize calculator_inputs.aiTier
  const tierKey = ensureString(
    calculatorInputs.aiTier, 
    calculatorResults.tierKey || 'growth'
  );
  
  const aiType = ensureString(
    calculatorInputs.aiType,
    calculatorResults.aiType || 'both'
  );
  
  // Get display names
  const tierName = getPlanName(tierKey);
  const aiTypeDisplay = getAiTypeDisplay(aiType);
  
  debugLog("Selected Tier:", {
    tierKey,
    tierName,
    source: calculatorInputs.aiTier ? "inputs" : "results"
  });
  
  // Voice minutes calculations - based on tier
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  
  // CRITICAL FIX: Prioritize calculator_inputs.callVolume
  let additionalVoiceMinutes = 0;
  
  if (tierKey === 'starter') {
    // Starter tier has no voice minutes
    additionalVoiceMinutes = 0;
    debugLog("Starter tier selected, setting additionalVoiceMinutes to 0");
  } else if (calculatorInputs.callVolume !== undefined) {
    // Use callVolume from inputs as the primary source of truth
    additionalVoiceMinutes = ensureNumber(calculatorInputs.callVolume, 0);
    debugLog("Using callVolume from calculator_inputs:", additionalVoiceMinutes);
  } else if (calculatorResults.additionalVoiceMinutes !== undefined) {
    // Fall back to results if inputs don't have callVolume
    additionalVoiceMinutes = ensureNumber(calculatorResults.additionalVoiceMinutes, 0);
    debugLog("Using additionalVoiceMinutes from results:", additionalVoiceMinutes);
  }
  
  // Financial calculations - recalculate based on tier and minutes
  const humanCostMonthly = ensureNumber(calculatorResults.humanCostMonthly, 3800);
  
  // Use tier-specific base prices
  const basePrices = {
    'starter': 99,
    'growth': 229,
    'premium': 429
  };
  const basePrice = basePrices[tierKey as keyof typeof basePrices] || 229;
  
  // Use tier-specific setup fees
  const setupFees = {
    'starter': 249,
    'growth': 749,
    'premium': 1149
  };
  const setupFee = setupFees[tierKey as keyof typeof setupFees] || 749;
  
  // Calculate voice cost based on additional minutes
  const voiceCost = tierKey === 'starter' ? 0 : additionalVoiceMinutes * 0.12;
  
  // Calculate total monthly cost
  const totalMonthlyCost = basePrice + voiceCost;
  
  // Recalculate savings values based on updated costs
  const monthlySavings = humanCostMonthly - totalMonthlyCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCostMonthly > 0 ? (monthlySavings / humanCostMonthly) * 100 : 0;
  
  // ROI calculations
  const breakEvenMonths = setupFee > 0 && monthlySavings > 0 
    ? Math.ceil(setupFee / monthlySavings) 
    : 1;
  const firstYearROI = setupFee > 0 
    ? Math.round((yearlySavings - setupFee) / setupFee * 100) 
    : 0;
  const fiveYearSavings = yearlySavings * 5;
  
  // Format date for proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
  
  // Brand Colors
  const brandRed = "1 0.322 0.157"; // RGB equivalent of #f65228
  
  // Create formatted values for display
  const formattedHumanCost = formatPdfCurrency(humanCostMonthly);
  const formattedBasePrice = formatPdfCurrency(basePrice);
  const formattedSetupFee = formatPdfCurrency(setupFee);
  const formattedVoiceCost = formatPdfCurrency(voiceCost);
  const formattedTotalCost = formatPdfCurrency(totalMonthlyCost);
  const formattedMonthlySavings = formatPdfCurrency(monthlySavings);
  const formattedYearlySavings = formatPdfCurrency(yearlySavings);
  const formattedSavingsPercentage = formatPdfPercentage(savingsPercentage);
  
  // Final verification log to confirm the values were properly processed
  debugLog("Final Proposal Data", {
    tierKey,
    tierName,
    aiType,
    aiTypeDisplay,
    basePrice,
    setupFee,
    additionalVoiceMinutes,
    voiceCost,
    totalMonthlyCost
  });
  
  return {
    brandRed,
    companyName,
    contactName,
    email,
    phoneNumber,
    industry,
    employeeCount,
    
    tierKey,
    tierName,
    aiType,
    aiTypeDisplay,
    includedVoiceMinutes,
    additionalVoiceMinutes,
    
    humanCostMonthly,
    basePrice,
    setupFee,
    voiceCost,
    totalMonthlyCost,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    breakEvenMonths,
    firstYearROI,
    fiveYearSavings,
    
    formattedDate,
    
    formattedHumanCost,
    formattedBasePrice,
    formattedSetupFee,
    formattedVoiceCost,
    formattedTotalCost,
    formattedMonthlySavings,
    formattedYearlySavings,
    formattedSavingsPercentage
  };
}
