
import { formatPdfCurrency, getPlanName, getAiTypeDisplay } from "./pdf-utils.ts";

/**
 * Proposal PDF Data Parameters 
 * Contains all the information needed to generate a proposal
 */
export interface ProposalData {
  // Company information
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  
  // Plan information
  tierKey: string;
  tierName: string;
  aiType: string;
  aiTypeDisplay: string;
  
  // Financial information
  basePriceMonthly: number;
  setupFee: number;
  humanCostMonthly: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  aiCostMonthly: {
    total: number;
    setupFee: number;
    voice: number;
    chatbot: number;
  };
  
  // Voice information
  includedVoiceMinutes: number;
  additionalVoiceMinutes: number;
  additionalVoiceCost: number;
  
  // Derived values
  annualPlan: number;
  breakEvenPoint: number;
  firstYearROI: number;
  fiveYearSavings: number;
  
  // Date information
  formattedDate: string;
  
  // Branding
  brandRed: string;
}

/**
 * Extract and sanitize all data needed for the PDF from the lead object
 */
export function extractProposalData(lead: any): ProposalData {
  console.log("Extracting proposal data from lead:", lead.id);
  
  // Create sanitized deep copy of lead data to avoid reference issues
  const sanitizedLead = JSON.parse(JSON.stringify(lead));
  
  // Ensure calculator_results exists
  if (!sanitizedLead.calculator_results) {
    console.error("Missing calculator_results, using defaults");
    sanitizedLead.calculator_results = {
      aiCostMonthly: { voice: 0, chatbot: 229, total: 229, setupFee: 749 },
      basePriceMonthly: 229,
      humanCostMonthly: 3800,
      monthlySavings: 3571,
      yearlySavings: 42852,
      savingsPercentage: 94,
      tierKey: "growth",
      aiType: "both",
      includedVoiceMinutes: 600,
      additionalVoiceMinutes: 0
    };
  }
  
  // Company information - use exactly what's in the lead
  const companyName = sanitizedLead.company_name || 'Client';
  const contactName = sanitizedLead.name || 'Valued Client';
  const email = sanitizedLead.email || 'client@example.com';
  const phoneNumber = sanitizedLead.phone_number || 'Not provided';
  const industry = sanitizedLead.industry || 'Technology';
  
  // Extract plan/pricing information directly without recalculation
  const tierKey = sanitizedLead.calculator_results.tierKey || 'growth';
  const aiType = sanitizedLead.calculator_results.aiType || 'both';
  
  // Get display names from keys
  const tierName = getPlanName(tierKey);
  const aiTypeDisplay = getAiTypeDisplay(aiType);
  
  // Take financial values exactly as stored, with no modifications
  const basePriceMonthly = sanitizedLead.calculator_results.basePriceMonthly || 229;
  const humanCostMonthly = sanitizedLead.calculator_results.humanCostMonthly || 3800;
  const monthlySavings = sanitizedLead.calculator_results.monthlySavings || 3571;
  const yearlySavings = sanitizedLead.calculator_results.yearlySavings || 42852;
  const savingsPercentage = sanitizedLead.calculator_results.savingsPercentage || 94;
  
  // Get the aiCostMonthly structure exactly as stored
  const aiCostMonthly = sanitizedLead.calculator_results.aiCostMonthly || {
    voice: 0,
    chatbot: 229,
    total: 229,
    setupFee: 749
  };
  
  // Get additional values directly from the calculator data
  const setupFee = aiCostMonthly.setupFee;
  const totalMonthlyCost = aiCostMonthly.total;
  const voiceCost = aiCostMonthly.voice || 0;
  
  // Safely extract additional voice minutes
  const additionalVoiceMinutes = sanitizedLead.calculator_results.additionalVoiceMinutes || 
                               sanitizedLead.calculator_inputs?.callVolume || 0;
  
  // Calculate additional voice cost
  const additionalVoiceCost = additionalVoiceMinutes * 0.12;
  
  // Get included minutes based on tier
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  
  // Safely access annualPlan with type checking
  const annualPlan = typeof sanitizedLead.calculator_results.annualPlan === 'number' 
                   ? sanitizedLead.calculator_results.annualPlan 
                   : basePriceMonthly * 10; // 2 months free with annual plan
  
  // Derived values for ROI calculations
  const breakEvenPoint = monthlySavings > 0 ? Math.ceil(setupFee / monthlySavings) : 1;
  const firstYearROI = monthlySavings > 0 ? Math.round((yearlySavings - setupFee) / setupFee * 100) : 0;
  const fiveYearSavings = yearlySavings * 5;
  
  // Format date for proposal
  const today = new Date();
  const formattedDate = `${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}, ${today.getFullYear()}`;
  
  // Brand Colors
  const brandRed = "#f65228"; // Corrected to your brand color
  
  console.log("Extracted data for PDF generation:", {
    companyName,
    tierKey,
    aiType,
    additionalVoiceMinutes,
    humanCostMonthly,
    monthlySavings
  });
  
  return {
    companyName,
    contactName,
    email,
    phoneNumber,
    industry,
    tierKey,
    tierName,
    aiType,
    aiTypeDisplay,
    basePriceMonthly,
    setupFee,
    humanCostMonthly,
    monthlySavings,
    yearlySavings,
    savingsPercentage,
    aiCostMonthly,
    includedVoiceMinutes,
    additionalVoiceMinutes,
    additionalVoiceCost,
    annualPlan,
    breakEvenPoint,
    firstYearROI,
    fiveYearSavings,
    formattedDate,
    brandRed
  };
}
