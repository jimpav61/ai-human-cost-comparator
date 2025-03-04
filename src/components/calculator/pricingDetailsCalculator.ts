
import { formatCurrency } from '@/utils/formatters';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import type { PricingDetail } from './types';
import { AI_RATES } from '@/constants/pricing';

export const calculatePricingDetails = (inputs: CalculatorInputs): PricingDetail[] => {
  const pricingDetails: PricingDetail[] = [];

  // Determine effective tier based on AI type
  let effectiveTier = inputs.aiTier;
  if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium') {
    effectiveTier = 'premium';
  }

  if (inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
    const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
    // Calculate the chargeable minutes (total minus included minutes)
    const includedMinutes = AI_RATES.chatbot[effectiveTier].includedVoiceMinutes || 0;
    
    // Calculate chargeable minutes (if any)
    const chargeableMinutes = Math.max(0, totalMinutes - includedMinutes);
    
    const minuteRate = AI_RATES.voice[effectiveTier];
    
    // Apply conversational factor for premium tier or conversational voice
    const isConversational = inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium';
    const conversationalFactor = (effectiveTier === 'premium' || isConversational) ? 1.15 : 1.0;
    const usageCost = chargeableMinutes * minuteRate * conversationalFactor;
    
    // Determine voice type based on tier and AI type
    let voiceType = 'Voice AI';
    if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium' || effectiveTier === 'premium') {
      voiceType = 'Conversational Voice AI';
    } else if (effectiveTier === 'growth' || inputs.aiType === 'both') {
      voiceType = 'Basic Voice AI';
    }
    
    // Only add voice details if there's actual usage or it's a combined plan
    if (totalMinutes > 0 || inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
      pricingDetails.push({
        title: voiceType,
        base: null,
        rate: `${formatCurrency(minuteRate)}${(effectiveTier === 'premium' || isConversational) ? ' + 15% premium' : ''}/minute after ${includedMinutes} included minutes`,
        totalMinutes: totalMinutes,
        monthlyCost: usageCost,
        usageCost: usageCost
      });
    }
  }

  if (inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
    const baseRate = AI_RATES.chatbot[effectiveTier].base;
    
    // For starter plan, there are no per-message costs
    if (effectiveTier === 'starter') {
      pricingDetails.push({
        title: 'Text AI',
        base: baseRate,
        rate: '$0.00/message',
        totalMessages: inputs.chatVolume * inputs.avgChatLength,
        monthlyCost: baseRate,
        usageCost: 0
      });
    } else {
      // For other plans, calculate per-message costs
      const totalMessages = inputs.chatVolume * inputs.avgChatLength;
      const perMessageRate = AI_RATES.chatbot[effectiveTier].perMessage;
      const messageUsageCost = totalMessages * perMessageRate;
      
      // Calculate volume discount
      let volumeDiscount = 0;
      let finalMessageCost = messageUsageCost;
      if (totalMessages > 50000) {
        volumeDiscount = messageUsageCost * 0.2; // 20% discount
        finalMessageCost = messageUsageCost * 0.8;
      } else if (totalMessages > 10000) {
        volumeDiscount = messageUsageCost * 0.1; // 10% discount
        finalMessageCost = messageUsageCost * 0.9;
      }
      
      // Use base rate only for actual cost calculation - no complexity factor
      pricingDetails.push({
        title: 'Text AI',
        base: baseRate,
        rate: `${formatCurrency(perMessageRate)}/message`,
        totalMessages: totalMessages,
        monthlyCost: baseRate + finalMessageCost,
        usageCost: finalMessageCost,
        volumeDiscount: volumeDiscount,
        complexityFactor: undefined // Remove complexity factor
      });
    }
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
