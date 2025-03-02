import { useState, useEffect } from 'react';
import { DEFAULT_AI_RATES, HUMAN_HOURLY_RATES, fetchPricingConfigurations, type AIRates } from '@/constants/pricing';

export interface CalculatorInputs {
  aiType: 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium';
  aiTier: 'starter' | 'growth' | 'premium';
  role: keyof typeof HUMAN_HOURLY_RATES;
  numEmployees: number;
  callVolume: number;
  avgCallDuration: number;
  chatVolume: number;
  avgChatLength: number;
  avgChatResolutionTime: number;
}

export interface CalculationResults {
  aiCostMonthly: {
    voice: number;
    chatbot: number;
    total: number;
    setupFee: number;
  };
  humanCostMonthly: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  breakEvenPoint: {
    voice: number;
    chatbot: number;
  };
  humanHours: {
    dailyPerEmployee: number;
    weeklyTotal: number;
    monthlyTotal: number;
    yearlyTotal: number;
  };
  annualPlan: number;
}

export const useCalculator = (inputs: CalculatorInputs): CalculationResults => {
  const [results, setResults] = useState<CalculationResults>({
    aiCostMonthly: { voice: 0, chatbot: 0, total: 0, setupFee: 0 },
    humanCostMonthly: 0,
    monthlySavings: 0,
    yearlySavings: 0,
    savingsPercentage: 0,
    breakEvenPoint: { voice: 0, chatbot: 0 },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 0,
      monthlyTotal: 0,
      yearlyTotal: 0
    },
    annualPlan: 0
  });
  
  const [aiRates, setAiRates] = useState<AIRates>(DEFAULT_AI_RATES);

  useEffect(() => {
    const loadPricing = async () => {
      const rates = await fetchPricingConfigurations();
      setAiRates(rates);
    };
    
    loadPricing();
  }, []);

  useEffect(() => {
    const HOURS_PER_SHIFT = 8;
    const DAYS_PER_WEEK = 5;
    const WEEKS_PER_YEAR = 52;
    const MONTHS_PER_YEAR = 12;

    const dailyHoursPerEmployee = HOURS_PER_SHIFT;
    const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
    const weeklyTotalHours = weeklyHoursPerEmployee * inputs.numEmployees;
    const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;

    const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
    const hourlyRateWithBenefits = baseHourlyRate * 1.3;
    const monthlyHumanCost = hourlyRateWithBenefits * monthlyTotalHours;

    let effectiveTier = inputs.aiTier;
    
    if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium') {
      effectiveTier = 'premium';
    }
    
    let monthlyVoiceCost = 0;
    let monthlyChatbotCost = 0;
    
    // Get base costs from the correct tier
    const chatbotRates = aiRates.chatbot[effectiveTier];
    const setupFee = chatbotRates.setupFee || 0;
    const annualPlan = chatbotRates.annualPrice || 0;
    
    // For starter plan, no voice capabilities
    if (effectiveTier === 'starter' && (inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium')) {
      // Voice not available in starter plan, force to chatbot only
      monthlyVoiceCost = 0;
    } 
    // For other plans with voice capabilities
    else if (inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
      const totalMinutesPerMonth = inputs.callVolume * inputs.avgCallDuration;
      const includedMinutes = aiRates.chatbot[effectiveTier].includedVoiceMinutes || 0;
      const chargeableMinutes = Math.max(0, totalMinutesPerMonth - includedMinutes);
      
      const voiceRate = aiRates.voice[effectiveTier];
      const isConversational = inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium';
      const conversationalFactor = (effectiveTier === 'premium' || isConversational) ? 1.15 : 1.0;
      
      monthlyVoiceCost = chargeableMinutes * voiceRate * conversationalFactor;
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
      const baseCost = chatbotRates.base;
      
      // For starter plan, there are no per-message costs
      if (effectiveTier === 'starter') {
        monthlyChatbotCost = baseCost;
      } else {
        const totalMessages = inputs.chatVolume * inputs.avgChatLength;
        const messageUsageCost = totalMessages * chatbotRates.perMessage;
        
        let finalMessageCost = messageUsageCost;
        if (totalMessages > 50000) {
          finalMessageCost = messageUsageCost * 0.8;
        } else if (totalMessages > 10000) {
          finalMessageCost = messageUsageCost * 0.9;
        }
        
        monthlyChatbotCost = baseCost + finalMessageCost;
      }
    }
    
    const monthlyAiCost = monthlyVoiceCost + monthlyChatbotCost;
    const monthlySavings = monthlyHumanCost - monthlyAiCost;
    const yearlySavings = monthlySavings * MONTHS_PER_YEAR;
    
    setResults({
      aiCostMonthly: {
        voice: monthlyVoiceCost,
        chatbot: monthlyChatbotCost,
        total: monthlyAiCost,
        setupFee: setupFee
      },
      humanCostMonthly: monthlyHumanCost,
      monthlySavings: monthlySavings,
      yearlySavings: yearlySavings,
      savingsPercentage: monthlyHumanCost > 0 ? (monthlySavings / monthlyHumanCost) * 100 : 0,
      breakEvenPoint: { 
        voice: Math.ceil(monthlyVoiceCost / (hourlyRateWithBenefits / 60)), 
        chatbot: Math.ceil(monthlyChatbotCost / (hourlyRateWithBenefits / 60))
      },
      humanHours: {
        dailyPerEmployee: dailyHoursPerEmployee,
        weeklyTotal: weeklyTotalHours,
        monthlyTotal: monthlyTotalHours,
        yearlyTotal: yearlyTotalHours
      },
      annualPlan: annualPlan
    });
  }, [inputs, aiRates]);

  return results;
};
