
import { useState, useEffect } from 'react';
import { DEFAULT_AI_RATES, HUMAN_HOURLY_RATES, fetchPricingConfigurations, type AIRates } from '@/constants/pricing';

export interface CalculatorInputs {
  aiType: 'voice' | 'chatbot' | 'both';
  aiTier: 'basic' | 'standard' | 'premium';
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
}

export const useCalculator = (inputs: CalculatorInputs): CalculationResults => {
  const [results, setResults] = useState<CalculationResults>({
    aiCostMonthly: { voice: 0, chatbot: 0, total: 0 },
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
    }
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

    // Calculate human hours
    const dailyHoursPerEmployee = HOURS_PER_SHIFT;
    const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
    const weeklyTotalHours = weeklyHoursPerEmployee * inputs.numEmployees;
    const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;

    // Calculate human cost
    const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
    const hourlyRateWithBenefits = baseHourlyRate;
    const monthlyHumanCost = hourlyRateWithBenefits * monthlyTotalHours;
    const yearlyHumanCost = monthlyHumanCost * MONTHS_PER_YEAR;

    // Calculate AI costs monthly
    let monthlyVoiceCost = 0;
    let monthlyChatbotCost = 0;
    
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      const totalMinutesPerMonth = inputs.callVolume * inputs.avgCallDuration;
      monthlyVoiceCost = totalMinutesPerMonth * aiRates.voice[inputs.aiTier];
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      const totalMessages = inputs.chatVolume * inputs.avgChatLength;
      const chatbotRates = aiRates.chatbot[inputs.aiTier];
      monthlyChatbotCost = chatbotRates.base + (totalMessages * chatbotRates.perMessage);
    }
    
    const monthlyAiCost = monthlyVoiceCost + monthlyChatbotCost;
    const yearlyAiCost = monthlyAiCost * MONTHS_PER_YEAR;
    
    const monthlySavings = monthlyHumanCost - monthlyAiCost;
    const yearlySavings = monthlySavings * MONTHS_PER_YEAR;
    
    setResults({
      aiCostMonthly: {
        voice: monthlyVoiceCost,
        chatbot: monthlyChatbotCost,
        total: monthlyAiCost
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
      }
    });
  }, [inputs, aiRates]);

  return results;
};
