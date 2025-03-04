
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
      console.log("Loaded pricing configurations:", rates);
    };
    
    loadPricing();
  }, []);

  useEffect(() => {
    console.log("Calculating with inputs:", inputs);
    console.log("Using AI rates:", aiRates);
    
    // Standard time calculations
    const HOURS_PER_SHIFT = 8;
    const DAYS_PER_WEEK = 5;
    const WEEKS_PER_YEAR = 52;
    const MONTHS_PER_YEAR = 12;

    // Calculate human resource time usage
    const dailyHoursPerEmployee = HOURS_PER_SHIFT;
    const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
    const weeklyTotalHours = weeklyHoursPerEmployee * inputs.numEmployees;
    const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;

    // Calculate human resource costs
    const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
    const hourlyRateWithBenefits = baseHourlyRate * 1.3; // Add 30% for benefits
    const monthlyHumanCost = hourlyRateWithBenefits * monthlyTotalHours;

    // Determine the effective tier for pricing calculations
    // If using conversational voice, ensure we're on premium tier
    let effectiveTier = inputs.aiTier;
    if (inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium') {
      effectiveTier = 'premium';
    }
    
    // Get base costs and setup fees for the correct tier
    const chatbotRates = aiRates.chatbot[effectiveTier];
    const basePrice = chatbotRates.base || 0;
    const setupFee = chatbotRates.setupFee || 0;
    const annualPlan = chatbotRates.annualPrice || 0;
    
    console.log("Base price for tier:", effectiveTier, basePrice);
    console.log("Setup fee:", setupFee);
    
    let monthlyVoiceCost = 0;
    let monthlyChatbotCost = 0;
    
    // Calculate voice costs if applicable
    if (inputs.aiType === 'voice' || inputs.aiType === 'conversationalVoice' || 
        inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
      
      // Starter plan has no voice capabilities
      if (effectiveTier === 'starter') {
        monthlyVoiceCost = 0;
      } else {
        // Calculate total minutes used
        const totalMinutesPerMonth = inputs.callVolume * inputs.avgCallDuration;
        
        // Get the included minutes for this tier
        const includedMinutes = aiRates.chatbot[effectiveTier].includedVoiceMinutes || 0;
        
        // Only charge for minutes above the included amount
        let chargeableMinutes = Math.max(0, totalMinutesPerMonth - includedMinutes);
        
        // Get the per-minute rate for this tier
        const voiceRate = aiRates.voice[effectiveTier];
        
        // Apply conversational factor for premium/conversational voice
        const isConversational = inputs.aiType === 'conversationalVoice' || inputs.aiType === 'both-premium';
        const conversationalFactor = (effectiveTier === 'premium' || isConversational) ? 1.15 : 1.0;
        
        // Calculate the voice cost
        monthlyVoiceCost = chargeableMinutes * voiceRate * conversationalFactor;
        
        console.log("Voice calculation:", {
          totalMinutesPerMonth,
          includedMinutes,
          chargeableMinutes,
          voiceRate,
          isConversational,
          conversationalFactor,
          monthlyVoiceCost
        });
      }
    }
    
    // Calculate chatbot costs if applicable
    if (inputs.aiType === 'chatbot' || inputs.aiType === 'both' || inputs.aiType === 'both-premium') {
      // Start with base monthly cost
      monthlyChatbotCost = basePrice;
      
      // For non-starter plans, add per-message costs
      if (effectiveTier !== 'starter') {
        // Calculate the total number of messages
        const totalMessages = inputs.chatVolume * inputs.avgChatLength;
        
        // Calculate the message usage cost
        const messageUsageCost = totalMessages * chatbotRates.perMessage;
        
        // Apply volume discounts
        let finalMessageCost = messageUsageCost;
        if (totalMessages > 50000) {
          finalMessageCost = messageUsageCost * 0.8; // 20% discount
        } else if (totalMessages > 10000) {
          finalMessageCost = messageUsageCost * 0.9; // 10% discount
        }
        
        // Add message costs to base cost
        monthlyChatbotCost += finalMessageCost;
        
        console.log("Chatbot calculation:", {
          basePrice,
          totalMessages,
          messageRate: chatbotRates.perMessage,
          messageUsageCost,
          finalMessageCost,
          monthlyChatbotCost
        });
      }
    }
    
    // Calculate total monthly AI cost
    const monthlyAiCost = monthlyVoiceCost + monthlyChatbotCost;
    
    // Calculate savings
    const monthlySavings = monthlyHumanCost - monthlyAiCost;
    const yearlySavings = monthlySavings * MONTHS_PER_YEAR;
    
    // Calculate savings percentage
    const savingsPercentage = monthlyHumanCost > 0 ? (monthlySavings / monthlyHumanCost) * 100 : 0;
    
    console.log("Final calculations:", {
      monthlyAiCost,
      monthlyHumanCost,
      monthlySavings,
      yearlySavings,
      savingsPercentage
    });
    
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
      savingsPercentage: savingsPercentage,
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
