
import { Lead } from "@/types/leads";
import { generateProposal } from "@/components/calculator/proposal/generateProposal";
import { getTierDisplayName, getAITypeDisplay, calculatePricingDetails } from "@/components/calculator/pricingDetailsCalculator";
import { AI_RATES } from "@/constants/pricing";
import { saveProposalPDF } from "./saveProposal";

export const generateFromInputs = async (lead: Lead): Promise<void> => {
  console.log("No calculator results found, calculating values");
  
  // Use the calculator inputs from lead or fallback to defaults
  const inputs = lead.calculator_inputs || {
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: lead.employee_count || 5,
    callVolume: 0, 
    avgCallDuration: 0,
    chatVolume: 2000,
    avgChatLength: 8,
    avgChatResolutionTime: 10
  };
  
  // Ensure we use the correct tier from the inputs
  const tierToUse = inputs.aiTier || 'starter';
  const aiTypeToUse = inputs.aiType || 'chatbot';
  
  // Get pricing details from AI_RATES
  const setupFee = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.setupFee || 0;
  const annualPrice = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.annualPrice || 0;
  const baseMonthlyPrice = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.base || 0;
  const includedVoiceMinutes = AI_RATES.chatbot[tierToUse as keyof typeof AI_RATES.chatbot]?.includedVoiceMinutes || 0;
  
  // Calculate pricing details based on the inputs
  const pricingDetails = calculatePricingDetails(inputs);
  
  // Calculate the total monthly cost (base + usage)
  let totalMonthlyAICost = baseMonthlyPrice;
  
  // Calculate voice costs if applicable
  let voiceCost = 0;
  if (aiTypeToUse === 'voice' || aiTypeToUse === 'conversationalVoice' || 
      aiTypeToUse === 'both' || aiTypeToUse === 'both-premium') {
      
    // Calculate total minutes used
    const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
    
    // Only charge for minutes above the included amount
    const chargeableMinutes = Math.max(0, totalMinutes - includedVoiceMinutes);
    
    // Get the per-minute rate for this tier
    const voiceRate = AI_RATES.voice[tierToUse as keyof typeof AI_RATES.voice] || 0;
    
    // Apply conversational factor for premium/conversational voice
    const isConversational = aiTypeToUse === 'conversationalVoice' || aiTypeToUse === 'both-premium';
    const conversationalFactor = (tierToUse === 'premium' || isConversational) ? 1.15 : 1.0;
    
    // Calculate voice cost
    voiceCost = chargeableMinutes * voiceRate * conversationalFactor;
    totalMonthlyAICost += voiceCost;
  }
  
  // Calculate human cost based on role and employees
  const humanCostMonthly = 3800; // Default human cost if not calculated
  
  // Calculate savings
  const monthlySavings = humanCostMonthly - totalMonthlyAICost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCostMonthly > 0 ? (monthlySavings / humanCostMonthly) * 100 : 0;
  
  // Create complete results object
  const results = {
    aiCostMonthly: { 
      voice: voiceCost, 
      chatbot: baseMonthlyPrice, 
      total: Math.max(totalMonthlyAICost, baseMonthlyPrice), // Ensure we never have 0 cost
      setupFee: setupFee
    },
    humanCostMonthly: humanCostMonthly,
    monthlySavings: monthlySavings,
    yearlySavings: yearlySavings,
    savingsPercentage: savingsPercentage,
    breakEvenPoint: { voice: 240, chatbot: 520 },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 200,
      monthlyTotal: 850,
      yearlyTotal: 10200
    },
    annualPlan: annualPrice,
    tierKey: tierToUse, // Add the tier key to be used in recommendedSolution
    basePriceMonthly: baseMonthlyPrice // Add the missing required property
  };
  
  // Get display names based on tier and aiType
  const tierName = getTierDisplayName(tierToUse);
  const aiType = getAITypeDisplay(aiTypeToUse);
  
  console.log("Before generating proposal document with:", {
    contactInfo: lead.name,
    companyName: lead.company_name,
    email: lead.email,
    tierName,
    aiType,
    tierToUse,
    aiTypeToUse,
    results
  });

  // Generate the proposal document using the imported function
  const doc = generateProposal({
    contactInfo: lead.name || 'Valued Client',
    companyName: lead.company_name || 'Your Company',
    email: lead.email || 'client@example.com',
    phoneNumber: lead.phone_number || '',
    industry: lead.industry || 'Other',
    employeeCount: lead.employee_count || 5,
    results: results,
    tierName: tierName,
    aiType: aiType,
    pricingDetails: pricingDetails
  });
  
  // Save the document
  saveProposalPDF(doc, lead);
};
