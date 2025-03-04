
import { formatCurrency } from '@/utils/formatters';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import type { PricingDetail } from './types';
import { AI_RATES } from '@/constants/pricing';

export const calculatePricingDetails = (inputs: CalculatorInputs): PricingDetail[] => {
  const pricingDetails: PricingDetail[] = [];

  // Get the exact base price for the selected tier
  const baseRate = AI_RATES.chatbot[inputs.aiTier].base;
  
  // Create a single pricing detail with the exact base price
  pricingDetails.push({
    title: inputs.aiType === 'chatbot' ? 'Text AI' : 
           inputs.aiType === 'voice' ? 'Voice AI' :
           inputs.aiType === 'conversationalVoice' ? 'Conversational Voice AI' :
           inputs.aiType === 'both' ? 'Text & Voice AI' : 'Text & Conversational Voice AI',
    base: baseRate,
    rate: null,
    totalMessages: inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium' 
      ? inputs.chatVolume * inputs.avgChatLength : null,
    totalMinutes: inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium' 
      ? inputs.callVolume * inputs.avgCallDuration : null,
    monthlyCost: baseRate,
    usageCost: 0
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
