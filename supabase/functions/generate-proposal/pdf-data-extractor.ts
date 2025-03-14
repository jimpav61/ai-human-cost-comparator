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
 */
export function extractProposalData(lead: any): ProposalData {
  debugLog("Lead Object for Extraction", {
    id: lead.id,
    company: lead.company_name,
    contact: lead.name,
    calculatorResults: lead.calculator_results ? Object.keys(lead.calculator_results) : "missing"
  });
  
  // Ensure calculator_results exists and is an object
  const calculatorResults = lead.calculator_results || {};
  debugLog("Calculator Results", calculatorResults);
  
  // Extract company and contact information with defaults
  const companyName = ensureString(lead.company_name, 'Your Company');
  const contactName = ensureString(lead.name, 'Valued Client');
  const email = ensureString(lead.email, 'client@example.com');
  const phoneNumber = ensureString(lead.phone_number, 'Not provided');
  const industry = ensureString(lead.industry, 'Technology');
  const employeeCount = ensureNumber(lead.employee_count, 5);
  
  // Extract and validate tier and AI type
  const tierKey = ensureString(calculatorResults.tierKey, 'growth');
  const aiType = ensureString(calculatorResults.aiType, 'both');
  
  // Get display names
  const tierName = getPlanName(tierKey);
  const aiTypeDisplay = getAiTypeDisplay(aiType);
  
  // Voice minutes calculations
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  const additionalVoiceMinutes = ensureNumber(
    calculatorResults.additionalVoiceMinutes || 
    (lead.calculator_inputs?.callVolume || 0)
  );
  
  // Financial calculations - ensure valid numbers with defaults
  const humanCostMonthly = ensureNumber(calculatorResults.humanCostMonthly, 3800);
  const basePrice = ensureNumber(calculatorResults.basePriceMonthly, 229);
  const setupFee = ensureNumber(calculatorResults.aiCostMonthly?.setupFee, 749);
  const voiceCost = ensureNumber(calculatorResults.aiCostMonthly?.voice, 0);
  const totalMonthlyCost = ensureNumber(calculatorResults.aiCostMonthly?.total, basePrice + voiceCost);
  const monthlySavings = ensureNumber(calculatorResults.monthlySavings, humanCostMonthly - totalMonthlyCost);
  const yearlySavings = ensureNumber(calculatorResults.yearlySavings, monthlySavings * 12);
  const savingsPercentage = ensureNumber(calculatorResults.savingsPercentage, 
    humanCostMonthly > 0 ? (monthlySavings / humanCostMonthly) * 100 : 0);
  
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
  
  debugLog("Extracted and Processed Data", {
    companyName,
    tierName,
    aiTypeDisplay,
    humanCostMonthly,
    totalMonthlyCost,
    savingsPercentage
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
