
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
  basePriceMonthly: number; // Base price field
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
    basePriceMonthly: 0, // Initialize base price
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

    // Get base costs and setup fees for the correct tier - these are the EXACT prices
    const chatbotRates = aiRates.chatbot[inputs.aiTier];
    const basePrice = chatbotRates.base || 0; // Just use the base price directly
    const setupFee = chatbotRates.setupFee || 0;
    const annualPlan = chatbotRates.annualPrice || 0;
    
    console.log("Base price for tier:", inputs.aiTier, basePrice);
    console.log("Setup fee:", setupFee);
    
    // DO NOT ADD ANY USAGE COSTS - just use the exact base price
    const monthlyAiCost = basePrice;
    
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
        voice: 0, // No separate voice cost - all included in the base price
        chatbot: basePrice, // Base price includes all features
        total: basePrice, // Total is exactly the base price - no additions
        setupFee: setupFee
      },
      basePriceMonthly: basePrice,
      humanCostMonthly: monthlyHumanCost,
      monthlySavings: monthlySavings,
      yearlySavings: yearlySavings,
      savingsPercentage: savingsPercentage,
      breakEvenPoint: { 
        voice: 0,
        chatbot: Math.ceil(basePrice / ((HUMAN_HOURLY_RATES[inputs.role] * 1.3) / 60))
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
