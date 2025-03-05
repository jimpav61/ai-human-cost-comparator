
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
  const totalVoiceMinutes = inputs.callVolume;
  const extraVoiceMinutes = Math.max(0, totalVoiceMinutes - includedVoiceMinutes);
  let additionalVoiceCost = 0;
  
  if (extraVoiceMinutes > 0 && inputs.aiTier !== 'starter') {
    // Always use 12¢ per minute for additional voice minutes
    const additionalMinuteRate = 0.12;
    additionalVoiceCost = extraVoiceMinutes * additionalMinuteRate;
  }
  
  // Total monthly cost
  const totalMonthlyCost = baseRate + additionalVoiceCost;
  
  // Create a pricing detail entry with the fixed base price
  pricingDetails.push({
    title: inputs.aiType === 'chatbot' ? 'Text AI' : 
           inputs.aiType === 'voice' ? 'Voice AI' :
           inputs.aiType === 'conversationalVoice' ? 'Conversational Voice AI' :
           inputs.aiType === 'both' ? 'Text & Voice AI' : 'Text & Conversational Voice AI',
    base: baseRate,
    rate: "Flat monthly rate",
    totalMessages: inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium' 
      ? inputs.chatVolume : null,
    totalMinutes: inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium' 
      ? totalVoiceMinutes : null,
    monthlyCost: baseRate
  });
  
  // Add additional voice minutes if applicable
  if (extraVoiceMinutes > 0 && inputs.aiTier !== 'starter') {
    // Always use 12¢ per minute for additional voice minutes
    const additionalMinuteRate = 0.12;
    pricingDetails.push({
      title: 'Additional Voice Minutes',
      base: 0,
      rate: `${formatCurrency(additionalMinuteRate)}/minute`,
      totalMessages: null,
      totalMinutes: extraVoiceMinutes,
      monthlyCost: additionalVoiceCost
    });
  }

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
