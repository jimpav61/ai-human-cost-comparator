
import { formatCurrency } from '@/utils/formatters';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import type { PricingDetail } from './types';

export const calculatePricingDetails = (inputs: CalculatorInputs): PricingDetail[] => {
  const pricingDetails: PricingDetail[] = [];

  // Hardcoded base prices to ensure consistency
  const hardcodedBasePrices = {
    starter: 99,
    growth: 229,
    premium: 429
  };
  
  // Get the exact base price for the selected tier
  const baseRate = hardcodedBasePrices[inputs.aiTier];
  
  // Calculate any additional voice costs
  // Always use 600 minutes for included voice in growth and premium plans
  const includedVoiceMinutes = inputs.aiTier === 'starter' ? 0 : 600;
  
  // Ensure callVolume is a number
  const extraVoiceMinutes = typeof inputs.callVolume === 'number' 
    ? inputs.callVolume 
    : parseInt(String(inputs.callVolume || '0'), 10) || 0;
    
  console.log("pricingDetailsCalculator: callVolume =", inputs.callVolume, "extraVoiceMinutes =", extraVoiceMinutes);
  
  const totalVoiceMinutes = inputs.aiTier !== 'starter' ? includedVoiceMinutes + extraVoiceMinutes : 0;
  
  let additionalVoiceCost = 0;
  
  if (extraVoiceMinutes > 0 && inputs.aiTier !== 'starter') {
    // Always use 12¢ per minute for additional voice minutes
    const additionalMinuteRate = 0.12;
    additionalVoiceCost = extraVoiceMinutes * additionalMinuteRate;
    console.log("pricingDetailsCalculator: Additional voice cost =", additionalVoiceCost);
  }
  
  // Total monthly cost
  const totalMonthlyCost = baseRate + additionalVoiceCost;
  
  // Create an appropriate title based on AI type and tier
  let planTitle = '';
  
  // Determine title based on AI type and tier
  if (inputs.aiTier === 'starter') {
    planTitle = 'Text AI (Starter Plan)';
  } else if (inputs.aiTier === 'growth') {
    if (inputs.aiType === 'chatbot') {
      planTitle = 'Text AI (Growth Plan)';
    } else if (inputs.aiType === 'voice') {
      planTitle = 'Voice AI (Growth Plan)';
    } else {
      planTitle = 'Text & Voice AI (Growth Plan)';
    }
  } else if (inputs.aiTier === 'premium') {
    if (inputs.aiType === 'chatbot') {
      planTitle = 'Text AI (Premium Plan)';
    } else if (inputs.aiType === 'conversationalVoice') {
      planTitle = 'Conversational Voice AI (Premium Plan)';
    } else {
      planTitle = 'Text & Conversational Voice AI (Premium Plan)';
    }
  }
  
  // Create a pricing detail entry with the fixed base price
  pricingDetails.push({
    title: planTitle,
    base: baseRate,
    rate: "Flat monthly rate",
    totalMessages: inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium' 
      ? inputs.chatVolume : null,
    totalMinutes: inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium' 
      ? totalVoiceMinutes : null,
    monthlyCost: baseRate
  });

  return pricingDetails;
};

export const getTierDisplayName = (aiTier: string): string => {
  switch(aiTier) {
    case 'starter': return 'Starter Plan (Text Only)';
    case 'growth': return 'Growth Plan (Text & Basic Voice)';
    case 'premium': return 'Premium Plan (Text & Conversational Voice)';
    default: return aiTier ? `${aiTier.charAt(0).toUpperCase() + aiTier.slice(1)} Plan` : 'Custom Plan';
  }
};

export const getAITypeDisplay = (aiType: string): string => {
  switch(aiType) {
    case 'chatbot': return 'Text Only';
    case 'voice': return 'Basic Voice Only';
    case 'conversationalVoice': return 'Conversational Voice Only';
    case 'both': return 'Text & Basic Voice';
    case 'both-premium': return 'Text & Conversational Voice';
    default: return aiType || '';
  }
};
