
import { formatCurrency } from '@/utils/formatters';
import type { CalculatorInputs } from '@/hooks/useCalculator';
import type { PricingDetail } from './types';
import { AI_RATES } from '@/constants/pricing';

export const calculatePricingDetails = (inputs: CalculatorInputs): PricingDetail[] => {
  const pricingDetails: PricingDetail[] = [];

  if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
    const totalMinutes = inputs.callVolume * inputs.avgCallDuration;
    // Calculate the chargeable minutes (total minus included minutes)
    const includedMinutes = AI_RATES.chatbot[inputs.aiTier].includedVoiceMinutes || 0;
    const chargeableMinutes = Math.max(0, totalMinutes - includedMinutes);
    const minuteRate = AI_RATES.voice[inputs.aiTier];
    const usageCost = chargeableMinutes * minuteRate;
    
    pricingDetails.push({
      title: 'Voice AI',
      base: null,
      rate: `${formatCurrency(minuteRate)}/minute after ${includedMinutes} included minutes`,
      totalMinutes: totalMinutes,
      monthlyCost: usageCost,
      usageCost: usageCost
    });
  }

  if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
    const totalMessages = inputs.chatVolume * inputs.avgChatLength;
    const baseRate = AI_RATES.chatbot[inputs.aiTier].base;
    const perMessageRate = AI_RATES.chatbot[inputs.aiTier].perMessage;
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
    
    // Calculate complexity factor
    const complexityFactor = Math.min(1.5, Math.max(1.0, inputs.avgChatResolutionTime / 10));
    
    pricingDetails.push({
      title: 'Text AI',
      base: baseRate,
      rate: `${formatCurrency(perMessageRate)}/message`,
      totalMessages: totalMessages,
      monthlyCost: baseRate + finalMessageCost,
      usageCost: messageUsageCost,
      volumeDiscount: volumeDiscount,
      complexityFactor: complexityFactor
    });
  }

  return pricingDetails;
};

export const getTierDisplayName = (aiTier: string): string => {
  switch(aiTier) {
    case 'starter': return 'Starter Plan';
    case 'growth': return 'Growth Plan';
    case 'premium': return 'Premium Plan';
    default: return 'Custom Plan';
  }
};

export const getAITypeDisplay = (aiType: string): string => {
  switch(aiType) {
    case 'chatbot': return 'Text Only';
    case 'voice': return 'Voice Only';
    case 'both': return 'Text & Voice';
    default: return '';
  }
};
