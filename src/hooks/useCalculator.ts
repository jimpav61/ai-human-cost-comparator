
import { useState, useEffect } from 'react';
import { DEFAULT_AI_RATES, HUMAN_HOURLY_RATES, fetchPricingConfigurations, type AIRates } from '@/constants/pricing';

export interface CalculatorInputs {
  aiType: 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium';
  aiTier: 'starter' | 'growth' | 'premium';
  role: keyof typeof HUMAN_HOURLY_RATES;
  numEmployees: number;
  callVolume: number;
  avgCallDuration: number; // Keep for backward compatibility, but we won't use it
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
    // Ensure we have valid inputs - use defaults if needed
    const validInputs: CalculatorInputs = {
      aiType: inputs.aiType || 'chatbot',
      aiTier: inputs.aiTier || 'starter',
      role: inputs.role || 'customerService',
      numEmployees: inputs.numEmployees || 5,
      callVolume: typeof inputs.callVolume === 'number' ? inputs.callVolume : 0,
      avgCallDuration: inputs.avgCallDuration || 3,
      chatVolume: inputs.chatVolume || 2000,
      avgChatLength: inputs.avgChatLength || 8,
      avgChatResolutionTime: inputs.avgChatResolutionTime || 10
    };
    
    console.log("Calculating with validated inputs:", validInputs);
    console.log("Using AI rates:", aiRates);
    
    // Standard time calculations
    const HOURS_PER_SHIFT = 8;
    const DAYS_PER_WEEK = 5;
    const WEEKS_PER_YEAR = 52;
    const MONTHS_PER_YEAR = 12;

    // Calculate human resource time usage
    const dailyHoursPerEmployee = HOURS_PER_SHIFT;
    const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
    const weeklyTotalHours = weeklyHoursPerEmployee * validInputs.numEmployees;
    const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;

    // Calculate human resource costs
    const baseHourlyRate = HUMAN_HOURLY_RATES[validInputs.role];
    const hourlyRateWithBenefits = baseHourlyRate * 1.3; // Add 30% for benefits
    const monthlyHumanCost = hourlyRateWithBenefits * monthlyTotalHours;

    // FIXED PRICES: Use hardcoded values to ensure consistency
    const hardcodedBasePrices = {
      starter: 99,
      growth: 229,
      premium: 429
    };
    
    // Get the exact fixed price for the selected tier
    const tierBase = hardcodedBasePrices[validInputs.aiTier];
    
    // Safe setup fee retrieval with fallback
    let setupFee = 0;
    try {
      if (aiRates.chatbot && 
          aiRates.chatbot[validInputs.aiTier] && 
          'setupFee' in aiRates.chatbot[validInputs.aiTier]) {
        setupFee = aiRates.chatbot[validInputs.aiTier].setupFee;
      } else {
        // Fallback to default values
        setupFee = validInputs.aiTier === 'starter' ? 249 : validInputs.aiTier === 'growth' ? 749 : 1149;
      }
    } catch (error) {
      console.error("Error getting setup fee:", error);
      setupFee = validInputs.aiTier === 'starter' ? 249 : validInputs.aiTier === 'growth' ? 749 : 1149;
    }
    
    // Safe annual plan retrieval with fallback
    let annualPlan = 0;
    try {
      if (aiRates.chatbot && 
          aiRates.chatbot[validInputs.aiTier] && 
          'annualPrice' in aiRates.chatbot[validInputs.aiTier]) {
        annualPlan = aiRates.chatbot[validInputs.aiTier].annualPrice;
      } else {
        // Fallback to default values
        annualPlan = validInputs.aiTier === 'starter' ? 990 : validInputs.aiTier === 'growth' ? 2290 : 4290;
      }
    } catch (error) {
      console.error("Error getting annual plan price:", error);
      annualPlan = validInputs.aiTier === 'starter' ? 990 : validInputs.aiTier === 'growth' ? 2290 : 4290;
    }
    
    console.log(`Using EXACT pricing for ${validInputs.aiTier} tier: ${tierBase}/month`);
    
    // Calculate additional voice costs - input field is now the ADDITIONAL minutes
    let additionalVoiceCost = 0;
    const includedVoiceMinutes = validInputs.aiTier === 'starter' ? 0 : 600;
    
    // inputs.callVolume now directly represents the additional minutes
    const extraVoiceMinutes = validInputs.callVolume;
    
    if (extraVoiceMinutes > 0 && validInputs.aiTier !== 'starter') {
      // Always use 12¢ per minute for additional voice minutes
      const additionalMinuteRate = 0.12;
      additionalVoiceCost = extraVoiceMinutes * additionalMinuteRate;
      console.log(`Additional voice minutes: ${extraVoiceMinutes} at rate ${additionalMinuteRate} = $${additionalVoiceCost}`);
    }
    
    // Total cost is base price plus any additional voice costs
    const totalMonthlyCost = tierBase + additionalVoiceCost;
    
    // Calculate savings
    const monthlySavings = monthlyHumanCost - totalMonthlyCost;
    const yearlySavings = monthlySavings * MONTHS_PER_YEAR;
    
    // Calculate savings percentage
    const savingsPercentage = monthlyHumanCost > 0 ? (monthlySavings / monthlyHumanCost) * 100 : 0;
    
    console.log("Final calculations:", {
      tierBase,
      additionalVoiceCost,
      totalMonthlyCost,
      monthlyHumanCost,
      monthlySavings,
      yearlySavings,
      savingsPercentage,
      setupFee,
      annualPlan
    });
    
    setResults({
      aiCostMonthly: {
        voice: additionalVoiceCost,
        chatbot: tierBase,
        total: totalMonthlyCost,
        setupFee: setupFee
      },
      basePriceMonthly: tierBase,
      humanCostMonthly: monthlyHumanCost,
      monthlySavings: monthlySavings,
      yearlySavings: yearlySavings,
      savingsPercentage: savingsPercentage,
      breakEvenPoint: { 
        voice: extraVoiceMinutes,
        chatbot: Math.ceil(totalMonthlyCost / ((HUMAN_HOURLY_RATES[validInputs.role] * 1.3) / 60))
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
