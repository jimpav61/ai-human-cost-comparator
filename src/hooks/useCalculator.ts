
import { useState, useEffect } from 'react';
import { AI_RATES, HUMAN_HOURLY_RATES } from '@/constants/pricing';

export interface CalculatorInputs {
  aiType: 'voice' | 'chatbot' | 'both';
  aiTier: 'basic' | 'standard' | 'premium';
  role: keyof typeof HUMAN_HOURLY_RATES;
  workHoursPerWeek: number;
  numEmployees: number;
  employeeBenefitsCost: number;
  employeeUtilization: number;
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
}

export const useCalculator = (inputs: CalculatorInputs): CalculationResults => {
  const [results, setResults] = useState<CalculationResults>({
    aiCostMonthly: { voice: 0, chatbot: 0, total: 0 },
    humanCostMonthly: 0,
    monthlySavings: 0,
    yearlySavings: 0,
    savingsPercentage: 0,
    breakEvenPoint: { voice: 0, chatbot: 0 }
  });

  useEffect(() => {
    // Calculate AI costs
    let voiceCost = 0;
    let chatbotCost = 0;
    
    // Voice AI cost calculation
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      const totalMinutesPerMonth = inputs.callVolume * inputs.avgCallDuration;
      voiceCost = totalMinutesPerMonth * AI_RATES.voice[inputs.aiTier];
    }
    
    // Chatbot cost calculation
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      const totalMessages = inputs.chatVolume * inputs.avgChatLength;
      chatbotCost = AI_RATES.chatbot[inputs.aiTier].base + 
        (totalMessages * AI_RATES.chatbot[inputs.aiTier].perMessage);
    }
    
    const totalAiCost = voiceCost + chatbotCost;
    
    // Calculate human cost
    const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
    const hourlyRateWithBenefits = baseHourlyRate * (1 + inputs.employeeBenefitsCost / 100);
    
    // Calculate monthly hours (workHoursPerWeek * 52 weeks / 12 months)
    const monthlyHoursPerEmployee = (inputs.workHoursPerWeek * 52) / 12;
    
    // Apply utilization rate
    const effectiveMonthlyHours = monthlyHoursPerEmployee * (inputs.employeeUtilization / 100);
    
    // Calculate total human cost per month
    const totalHumanCost = hourlyRateWithBenefits * monthlyHoursPerEmployee * inputs.numEmployees;
    
    // Calculate service capacity and required staff
    let totalServiceMinutesRequired = 0;
    
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      totalServiceMinutesRequired += (inputs.callVolume * inputs.avgCallDuration);
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      totalServiceMinutesRequired += (inputs.chatVolume * inputs.avgChatResolutionTime);
    }
    
    // Convert to hours
    const totalServiceHoursRequired = totalServiceMinutesRequired / 60;
    
    // Calculate required number of employees based on service volume
    const minRequiredEmployees = Math.ceil(totalServiceHoursRequired / effectiveMonthlyHours);
    
    // Use the larger of actual employees or required employees
    const effectiveEmployees = Math.max(inputs.numEmployees, minRequiredEmployees);
    
    // Recalculate total human cost with effective number of employees
    const adjustedHumanCost = hourlyRateWithBenefits * monthlyHoursPerEmployee * effectiveEmployees;

    const savings = adjustedHumanCost - totalAiCost;
    
    setResults({
      aiCostMonthly: {
        voice: voiceCost,
        chatbot: chatbotCost,
        total: totalAiCost
      },
      humanCostMonthly: adjustedHumanCost,
      monthlySavings: savings,
      yearlySavings: savings * 12,
      savingsPercentage: adjustedHumanCost > 0 ? (savings / adjustedHumanCost) * 100 : 0,
      breakEvenPoint: { 
        voice: Math.ceil(voiceCost / (hourlyRateWithBenefits / 60)), 
        chatbot: Math.ceil(chatbotCost / (hourlyRateWithBenefits / 60))
      }
    });
  }, [inputs]);

  return results;
};
