import { useState, useEffect } from 'react';
import { AI_RATES, HUMAN_HOURLY_RATES } from '@/constants/pricing';

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

    // Calculate human cost
    const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
    const hourlyRateWithBenefits = baseHourlyRate;
    
    // Calculate monthly human cost based on total hours
    const totalHumanCost = hourlyRateWithBenefits * monthlyTotalHours;

    // Calculate AI costs
    let voiceCost = 0;
    let chatbotCost = 0;
    
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      const totalMinutesPerMonth = inputs.callVolume * inputs.avgCallDuration;
      voiceCost = totalMinutesPerMonth * AI_RATES.voice[inputs.aiTier];
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      const totalMessages = inputs.chatVolume * inputs.avgChatLength;
      chatbotCost = AI_RATES.chatbot[inputs.aiTier].base + 
        (totalMessages * AI_RATES.chatbot[inputs.aiTier].perMessage);
    }
    
    const totalAiCost = voiceCost + chatbotCost;
    
    // Calculate service requirements
    let totalServiceMinutesRequired = 0;
    
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      totalServiceMinutesRequired += (inputs.callVolume * inputs.avgCallDuration);
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      totalServiceMinutesRequired += (inputs.chatVolume * inputs.avgChatResolutionTime);
    }
    
    // Calculate effective work hours considering utilization rate
    const effectiveMonthlyHours = monthlyTotalHours;
    const totalServiceHoursRequired = totalServiceMinutesRequired / 60;
    
    // Calculate required number of employees based on service volume
    const minRequiredEmployees = Math.ceil(totalServiceHoursRequired / effectiveMonthlyHours);
    const effectiveEmployees = Math.max(inputs.numEmployees, minRequiredEmployees);
    
    // Recalculate final human cost based on effective employees
    const finalHumanCost = hourlyRateWithBenefits * monthlyTotalHours * (effectiveEmployees / inputs.numEmployees);
    const savings = finalHumanCost - totalAiCost;
    
    setResults({
      aiCostMonthly: {
        voice: voiceCost,
        chatbot: chatbotCost,
        total: totalAiCost
      },
      humanCostMonthly: finalHumanCost,
      monthlySavings: savings,
      yearlySavings: savings * 12,
      savingsPercentage: finalHumanCost > 0 ? (savings / finalHumanCost) * 100 : 0,
      breakEvenPoint: { 
        voice: Math.ceil(voiceCost / (hourlyRateWithBenefits / 60)), 
        chatbot: Math.ceil(chatbotCost / (hourlyRateWithBenefits / 60))
      },
      humanHours: {
        dailyPerEmployee: dailyHoursPerEmployee,
        weeklyTotal: weeklyTotalHours,
        monthlyTotal: monthlyTotalHours,
        yearlyTotal: yearlyTotalHours
      }
    });
  }, [inputs]);

  return results;
};
