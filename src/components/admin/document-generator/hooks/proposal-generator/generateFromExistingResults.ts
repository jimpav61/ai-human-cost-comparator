
import { Lead } from "@/types/leads";
import { generateProposal } from "@/components/calculator/proposal/generateProposal";
import { getTierDisplayName, getAITypeDisplay, calculatePricingDetails } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";
import { saveProposalPDF } from "./saveProposal";

export const generateFromExistingResults = async (lead: Lead): Promise<void> => {
  const tierToUse = lead.calculator_inputs?.aiTier || 'starter';
  const aiTypeToUse = lead.calculator_inputs?.aiType || 'chatbot';
  
  // Get display names based on tier and aiType
  const tierName = getTierDisplayName(tierToUse);
  const aiType = getAITypeDisplay(aiTypeToUse);
  
  // Calculate pricing details based on the inputs
  const pricingDetails = calculatePricingDetails(lead.calculator_inputs || {
    aiType: aiTypeToUse,
    aiTier: tierToUse,
    role: 'customerService',
    numEmployees: lead.employee_count || 5,
    callVolume: 0,
    avgCallDuration: 4.5,
    chatVolume: 2000,
    avgChatLength: 8,
    avgChatResolutionTime: 10
  });
  
  console.log("Using lead's existing calculator results:", lead.calculator_results);
  
  // Ensure we have valid values in the results
  const validatedResults = { ...lead.calculator_results };
  
  // Make sure aiCostMonthly structure exists
  if (!validatedResults.aiCostMonthly) {
    validatedResults.aiCostMonthly = {
      voice: 0,
      chatbot: AI_RATES.chatbot[tierToUse].base,
      total: AI_RATES.chatbot[tierToUse].base,
      setupFee: AI_RATES.chatbot[tierToUse].setupFee
    };
  } else {
    // Ensure total is not 0
    if (!validatedResults.aiCostMonthly.total || validatedResults.aiCostMonthly.total === 0) {
      validatedResults.aiCostMonthly.total = AI_RATES.chatbot[tierToUse].base;
    }
    
    // Ensure chatbot cost is not 0
    if (!validatedResults.aiCostMonthly.chatbot || validatedResults.aiCostMonthly.chatbot === 0) {
      validatedResults.aiCostMonthly.chatbot = AI_RATES.chatbot[tierToUse].base;
    }
    
    // Ensure setup fee is not 0
    if (!validatedResults.aiCostMonthly.setupFee || validatedResults.aiCostMonthly.setupFee === 0) {
      validatedResults.aiCostMonthly.setupFee = AI_RATES.chatbot[tierToUse].setupFee;
    }
  }
  
  // Add the tier key to be used in recommendedSolution
  validatedResults.tierKey = tierToUse;
  
  // Fix the common "Cannot read properties of undefined (reading 'base')" error
  // Make sure humanCostMonthly exists and is not 0
  if (!validatedResults.humanCostMonthly) {
    validatedResults.humanCostMonthly = 3800; // Fallback value
  }
  
  // Ensure basePriceMonthly exists
  if (!validatedResults.basePriceMonthly) {
    validatedResults.basePriceMonthly = AI_RATES.chatbot[tierToUse].base;
  }
  
  // Generate the proposal document using the imported function with the validated results
  const doc = generateProposal({
    contactInfo: lead.name || 'Valued Client',
    companyName: lead.company_name || 'Your Company',
    email: lead.email || 'client@example.com',
    phoneNumber: lead.phone_number || '',
    industry: lead.industry || 'Other',
    employeeCount: lead.employee_count || 5,
    results: validatedResults,
    tierName: tierName,
    aiType: aiType,
    pricingDetails: pricingDetails
  });
  
  // Save the document
  saveProposalPDF(doc, lead);
};
