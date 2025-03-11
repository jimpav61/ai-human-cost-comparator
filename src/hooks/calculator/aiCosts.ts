
import { CalculatorInputs } from './types';
import { HARDCODED_BASE_PRICES, ADDITIONAL_MINUTE_RATE, INCLUDED_VOICE_MINUTES } from './constants';

/**
 * Calculate AI costs and pricing details
 */
export function calculateAICosts(inputs: CalculatorInputs, aiRates: any) {
  console.log("Calculating AI costs with inputs:", inputs);
  
  // Get the exact fixed price for the selected tier
  const tierBase = HARDCODED_BASE_PRICES[inputs.aiTier];
  console.log("Tier base price:", tierBase, "for tier:", inputs.aiTier);
  
  // Calculate additional voice costs - input field is now the ADDITIONAL minutes
  let additionalVoiceCost = 0;
  const includedVoiceMinutes = INCLUDED_VOICE_MINUTES[inputs.aiTier];
  
  // inputs.callVolume now directly represents the additional minutes
  const extraVoiceMinutes = inputs.callVolume;
  console.log("Extra voice minutes:", extraVoiceMinutes, "Included minutes:", includedVoiceMinutes);
  
  if (extraVoiceMinutes > 0 && inputs.aiTier !== 'starter') {
    additionalVoiceCost = extraVoiceMinutes * ADDITIONAL_MINUTE_RATE;
    console.log("Additional voice cost:", additionalVoiceCost);
  }
  
  // Calculate setup fee
  let setupFee = 0;
  try {
    if (aiRates.chatbot && 
        aiRates.chatbot[inputs.aiTier] && 
        'setupFee' in aiRates.chatbot[inputs.aiTier]) {
      setupFee = aiRates.chatbot[inputs.aiTier].setupFee;
    } else {
      // Fallback to default values
      setupFee = inputs.aiTier === 'starter' ? 499 : inputs.aiTier === 'growth' ? 749 : 999;
    }
  } catch (error) {
    console.error("Error getting setup fee:", error);
    setupFee = inputs.aiTier === 'starter' ? 499 : inputs.aiTier === 'growth' ? 749 : 999;
  }
  
  // Calculate annual plan price
  let annualPlan = 0;
  try {
    if (aiRates.chatbot && 
        aiRates.chatbot[inputs.aiTier] && 
        'annualPrice' in aiRates.chatbot[inputs.aiTier]) {
      annualPlan = aiRates.chatbot[inputs.aiTier].annualPrice;
    } else {
      // Fallback to default values
      annualPlan = inputs.aiTier === 'starter' ? 990 : inputs.aiTier === 'growth' ? 2290 : 4290;
    }
  } catch (error) {
    console.error("Error getting annual plan price:", error);
    annualPlan = inputs.aiTier === 'starter' ? 990 : inputs.aiTier === 'growth' ? 2290 : 4290;
  }
  
  // Total monthly cost
  const totalMonthlyCost = tierBase + additionalVoiceCost;
  console.log("Total monthly cost:", totalMonthlyCost);
  
  return {
    tierBase,
    additionalVoiceCost,
    setupFee,
    annualPlan,
    totalMonthlyCost,
    extraVoiceMinutes
  };
}
