import { useState, useEffect } from 'react';
import { AI_RATES, HUMAN_HOURLY_RATES } from '@/constants/pricing';
import { supabase } from '@/lib/supabase';
import { toast } from "@/components/ui/use-toast";

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
    const effectiveHourlyRate = HUMAN_HOURLY_RATES[inputs.role] * 
      (1 + inputs.employeeBenefitsCost / 100);
    
    const hoursPerMonth = (inputs.workHoursPerWeek * 52) / 12;
    const effectiveHoursPerMonth = hoursPerMonth * (inputs.employeeUtilization / 100);
    
    let totalHumanTime = 0;
    
    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      totalHumanTime += inputs.callVolume * inputs.avgCallDuration;
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      totalHumanTime += (inputs.chatVolume / inputs.avgChatLength) * inputs.avgChatResolutionTime;
    }
    
    const totalHumanHours = totalHumanTime / 60;
    const requiredEmployees = Math.max(inputs.numEmployees, 
      Math.ceil(totalHumanHours / effectiveHoursPerMonth));
    
    const totalHumanCost = effectiveHourlyRate * hoursPerMonth * requiredEmployees;
    
    // Calculate break-even points with fixed costs consideration
    let voiceBreakEven = 0;
    let chatBreakEven = 0;

    if (inputs.aiType === 'voice' || inputs.aiType === 'both') {
      const voiceAiCostPerMinute = AI_RATES.voice[inputs.aiTier];
      const humanCostPerMinute = effectiveHourlyRate / 60;
      
      if (voiceAiCostPerMinute < humanCostPerMinute) {
        // Break-even volume = Fixed Human Costs / (Human Cost per Unit - AI Cost per Unit)
        voiceBreakEven = Math.ceil(
          (effectiveHourlyRate * hoursPerMonth * requiredEmployees) / 
          ((humanCostPerMinute - voiceAiCostPerMinute) * inputs.avgCallDuration)
        );
      }
    }
    
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both') {
      const chatbotFixedCost = AI_RATES.chatbot[inputs.aiTier].base;
      const chatbotVariableCost = AI_RATES.chatbot[inputs.aiTier].perMessage * inputs.avgChatLength;
      const humanCostPerChat = (effectiveHourlyRate / 60) * inputs.avgChatResolutionTime;
      
      if ((chatbotFixedCost / inputs.chatVolume + chatbotVariableCost) < humanCostPerChat) {
        chatBreakEven = Math.ceil(
          chatbotFixedCost / 
          (humanCostPerChat - chatbotVariableCost)
        );
      }
    }

    const savings = totalHumanCost - totalAiCost;
    
    const saveCalculation = async () => {
      try {
        const { error } = await supabase
          .from('calculations')
          .insert([
            {
              input_data: inputs,
              results: {
                aiCostMonthly: {
                  voice: voiceCost,
                  chatbot: chatbotCost,
                  total: totalAiCost
                },
                humanCostMonthly: totalHumanCost,
                monthlySavings: savings,
                yearlySavings: savings * 12,
                savingsPercentage: totalHumanCost > 0 ? (savings / totalHumanCost) * 100 : 0,
                breakEvenPoint: { 
                  voice: voiceBreakEven, 
                  chatbot: chatBreakEven 
                }
              }
            }
          ]);

        if (error) {
          console.error('Error saving calculation:', error);
          toast({
            title: "Calculation Storage Error",
            description: "Your calculation was completed but couldn't be saved.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error('Error saving calculation:', err);
      }
    };

    saveCalculation();

    setResults({
      aiCostMonthly: {
        voice: voiceCost,
        chatbot: chatbotCost,
        total: totalAiCost
      },
      humanCostMonthly: totalHumanCost,
      monthlySavings: savings,
      yearlySavings: savings * 12,
      savingsPercentage: totalHumanCost > 0 ? (savings / totalHumanCost) * 100 : 0,
      breakEvenPoint: { voice: voiceBreakEven, chatbot: chatBreakEven }
    });
  }, [inputs]);

  return results;
};
