
import { Lead } from "@/types/leads";
import { AI_RATES } from "@/constants/pricing";

/**
 * Processes calculator data from the lead
 */
export function getCalculatorData(lead: Lead) {
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
  
  // Get the tier and AI type directly from inputs
  const tierKey = inputs.aiTier || 'starter';
  const aiTypeToUse = inputs.aiType || 'chatbot';
  
  // Calculate included voice minutes based on tier
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 
                              (tierKey === 'growth' ? 600 : 1200);
  
  // Get voice minutes data
  const extraVoiceMinutes = inputs.callVolume || 0;
  
  // Ensure calculator_results has all required properties with fallbacks
  let safeResults = {
    aiCostMonthly: {
      voice: 0,
      chatbot: 0,
      total: 0,
      setupFee: 0,
    },
    basePriceMonthly: AI_RATES.chatbot[tierKey].base,
    tierKey,
    aiType: aiTypeToUse
  };
  
  if (lead.calculator_results) {
    console.log("Using lead's existing calculator results:", lead.calculator_results);
    
    // Initialize a safe result object with the lead's calculator_results
    safeResults = {
      ...lead.calculator_results,
      // Ensure aiCostMonthly exists with all required properties
      aiCostMonthly: {
        voice: 0,
        chatbot: 0,
        total: 0,
        setupFee: 0,
        ...((lead.calculator_results.aiCostMonthly || {}) as any)
      }
    };
    
    // Ensure setupFee exists (this is the property causing the error)
    if (!safeResults.aiCostMonthly.setupFee) {
      console.warn("setupFee missing, adding default value based on tier");
      safeResults.aiCostMonthly.setupFee = AI_RATES.chatbot[tierKey].setupFee;
    }
    
    // Ensure other required properties exist
    if (!safeResults.aiCostMonthly.total) {
      safeResults.aiCostMonthly.total = safeResults.basePriceMonthly || 
        AI_RATES.chatbot[tierKey].base;
    }
    
    if (!safeResults.basePriceMonthly) {
      safeResults.basePriceMonthly = AI_RATES.chatbot[tierKey].base;
    }
  } else {
    // If no calculator results exist, create default values
    console.warn("No calculator results found, using fallback values");
    
    // Default values used only if no calculator results exist
    const setupFee = AI_RATES.chatbot[tierKey].setupFee;
    const baseMonthlyPrice = AI_RATES.chatbot[tierKey].base;
    let additionalVoiceCost = 0;
    
    if (extraVoiceMinutes > 0 && tierKey !== 'starter') {
      additionalVoiceCost = extraVoiceMinutes * 0.12;
    }
    
    safeResults = {
      aiCostMonthly: { 
        voice: additionalVoiceCost, 
        chatbot: baseMonthlyPrice, 
        total: baseMonthlyPrice + additionalVoiceCost, 
        setupFee: setupFee
      },
      basePriceMonthly: baseMonthlyPrice,
      humanCostMonthly: 3800,
      monthlySavings: 3800 - (baseMonthlyPrice + additionalVoiceCost),
      yearlySavings: (3800 - (baseMonthlyPrice + additionalVoiceCost)) * 12,
      savingsPercentage: ((3800 - (baseMonthlyPrice + additionalVoiceCost)) / 3800) * 100,
      breakEvenPoint: { voice: extraVoiceMinutes, chatbot: 520 },
      humanHours: {
        dailyPerEmployee: 8,
        weeklyTotal: 200,
        monthlyTotal: 850,
        yearlyTotal: 10200
      },
      annualPlan: AI_RATES.chatbot[tierKey].annualPrice,
      tierKey,
      aiType: aiTypeToUse
    };
  }

  return {
    safeResults,
    tierKey,
    aiTypeToUse,
    includedVoiceMinutes,
    extraVoiceMinutes
  };
}
