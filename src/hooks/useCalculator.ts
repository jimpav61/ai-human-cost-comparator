
import { useState, useEffect } from 'react';
import { DEFAULT_AI_RATES, HUMAN_HOURLY_RATES, fetchPricingConfigurations, type AIRates } from '@/constants/pricing';

export interface CalculatorInputs {
  aiType: 'voice' | 'chatbot' | 'both';
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
    // Constants for time calculations
    const HOURS_PER_SHIFT = 8;
    const DAYS_PER_WEEK = 5;
    const WEEKS_PER_YEAR = 52;
    const MONTHS_PER_YEAR = 12;

    // Calculate human hours based on number of employees
    const dailyHoursPerEmployee = HOURS_PER_SHIFT;
    const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
    const weeklyTotalHours = weeklyHoursPerEmployee * inputs.numEmployees;
    const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;

    // Calculate human cost with industry-specific rates
    const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
    // Add benefits and overhead (typically 30% additional cost)
    const hourlyRateWithBenefits = baseHourlyRate * 1.3;
    const monthlyHumanCost = hourlyRateWithBenefits * monthlyTotalHours;

    // Determine the appropriate tier based on needs
    const effectiveTier = inputs.aiTier;
    
    // Calculate AI costs monthly based on the selected tier
    let monthlyVoiceCost = 0;
    let monthlyChatbotCost = 0;
    let setupFee = aiRates.chatbot[effectiveTier].setupFee || 0;
    let annualPlan = aiRates.chatbot[effectiveTier].annualPrice || 0;
    
    // Calculate voice costs only if voice is enabled
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      const totalMinutesPerMonth = inputs.callVolume * inputs.avgCallDuration;
      const includedMinutes = aiRates.chatbot[effectiveTier].includedVoiceMinutes || 0;
      const chargeableMinutes = Math.max(0, totalMinutesPerMonth - includedMinutes);
      
      // Apply premium conversational voice factor if premium tier
      const voiceRate = aiRates.voice[effectiveTier];
      const conversationalFactor = effectiveTier === 'premium' ? 1.15 : 1.0; // 15% premium for conversational capabilities
      
      monthlyVoiceCost = chargeableMinutes * voiceRate * conversationalFactor;
    }
    
    // Calculate chatbot costs only if chatbot is enabled
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      const chatbotRates = aiRates.chatbot[effectiveTier];
      
      // Start with base cost
      monthlyChatbotCost = chatbotRates.base;
      
      // Calculate message costs
      const totalMessages = inputs.chatVolume * inputs.avgChatLength;
      const messageUsageCost = totalMessages * chatbotRates.perMessage;
      
      // Apply volume discounts if applicable
      let finalMessageCost = messageUsageCost;
      if (totalMessages > 50000) {
        finalMessageCost = messageUsageCost * 0.8; // 20% discount
      } else if (totalMessages > 10000) {
        finalMessageCost = messageUsageCost * 0.9; // 10% discount
      }
      
      // Add message costs to base cost
      monthlyChatbotCost += finalMessageCost;
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
