
import { HUMAN_HOURLY_RATES } from '@/constants/pricing';
import { CalculatorInputs, CalculationResults } from './types';

// Constants for time calculations
const HOURS_PER_SHIFT = 8;
const DAYS_PER_WEEK = 5;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

// Hardcoded base prices to ensure consistency
const HARDCODED_BASE_PRICES = {
  starter: 99,
  growth: 229,
  premium: 429
};

/**
 * Validate calculator inputs and provide defaults
 */
export function validateInputs(inputs: CalculatorInputs): CalculatorInputs {
  console.log("Validating calculator inputs:", inputs);
  
  // Ensure aiType is consistent with aiTier
  let aiType = inputs.aiType || 'chatbot';
  const aiTier = inputs.aiTier || 'starter';
  
  // Force consistent AI type values based on tier
  if (aiTier === 'starter' && aiType !== 'chatbot') {
    aiType = 'chatbot';
    console.log("Starter plan can only use chatbot - corrected aiType to:", aiType);
  } else if (aiTier === 'premium') {
    if (aiType === 'voice') {
      aiType = 'conversationalVoice';
      console.log("Premium plan upgraded voice to conversational - corrected aiType to:", aiType);
    } else if (aiType === 'both') {
      aiType = 'both-premium';
      console.log("Premium plan upgraded voice features - corrected aiType to:", aiType);
    }
  } else if (aiTier === 'growth') {
    if (aiType === 'conversationalVoice') {
      aiType = 'voice';
      console.log("Growth plan can only use basic voice - corrected aiType to:", aiType);
    } else if (aiType === 'both-premium') {
      aiType = 'both';
      console.log("Growth plan can only use basic voice features - corrected aiType to:", aiType);
    }
  }
  
  // CRITICAL: Always calculate based on replacing ONE employee, regardless of total employees
  const validatedInputs = {
    aiType: aiType,
    aiTier: aiTier,
    role: inputs.role || 'customerService',
    numEmployees: 1, // Force to 1 for calculations
    callVolume: inputs.callVolume || 0,
    avgCallDuration: 0,
    chatVolume: inputs.chatVolume || 2000,
    avgChatLength: 0,
    avgChatResolutionTime: 0
  };
  
  console.log("Validated calculator inputs (forcing 1:1 replacement):", validatedInputs);
  return validatedInputs;
}

/**
 * Calculate human resource metrics based on total employees minus one (replaced by AI)
 */
export function calculateHumanResources(inputs: CalculatorInputs) {
  // Always calculate for ONE employee only, regardless of total employees
  const employeesAfterAI = 1; // We're replacing exactly one employee
  const dailyHoursPerEmployee = HOURS_PER_SHIFT;
  const weeklyHoursPerEmployee = dailyHoursPerEmployee * DAYS_PER_WEEK;
  const weeklyTotalHours = weeklyHoursPerEmployee * employeesAfterAI;
  const monthlyTotalHours = (weeklyTotalHours * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
  const yearlyTotalHours = weeklyTotalHours * WEEKS_PER_YEAR;
  
  return {
    dailyPerEmployee: dailyHoursPerEmployee,
    weeklyTotal: weeklyTotalHours,
    monthlyTotal: monthlyTotalHours,
    yearlyTotal: yearlyTotalHours
  };
}

/**
 * Calculate human resource costs based on remaining employees after AI replacement
 */
export function calculateHumanCosts(inputs: CalculatorInputs, monthlyHours: number) {
  const baseHourlyRate = HUMAN_HOURLY_RATES[inputs.role];
  const hourlyRateWithBenefits = baseHourlyRate * 1.3; // Add 30% for benefits
  const monthlyHumanCost = hourlyRateWithBenefits * monthlyHours;
  
  return {
    hourlyRate: baseHourlyRate,
    hourlyRateWithBenefits,
    monthlyHumanCost
  };
}

/**
 * Calculate AI costs and pricing details
 */
export function calculateAICosts(inputs: CalculatorInputs, aiRates: any) {
  console.log("Calculating AI costs with inputs:", inputs);
  
  // Get the exact fixed price for the selected tier
  const tierBase = HARDCODED_BASE_PRICES[inputs.aiTier];
  console.log("Tier base price:", tierBase, "for tier:", inputs.aiTier);
  
  // Calculate additional voice costs - input field is now the ADDITIONAL minutes
  let additionalVoiceCost = 0;
  const includedVoiceMinutes = inputs.aiTier === 'starter' ? 0 : 600;
  
  // inputs.callVolume now directly represents the additional minutes
  const extraVoiceMinutes = inputs.callVolume;
  console.log("Extra voice minutes:", extraVoiceMinutes, "Included minutes:", includedVoiceMinutes);
  
  if (extraVoiceMinutes > 0 && inputs.aiTier !== 'starter') {
    // Always use 12¢ per minute for additional voice minutes
    const additionalMinuteRate = 0.12;
    additionalVoiceCost = extraVoiceMinutes * additionalMinuteRate;
    console.log("Additional voice cost:", additionalVoiceCost);
  }
  
  // Calculate setup fee
  let setupFee = 0;
  try {
    if (aiRates.chatbot && 
        aiRates.chatbot[inputs.aiTier] && 
        'setupFee' in aiRates.chatbot[inputs.aiTier]) {
      setupFee = aiRates.chatbot[inputs.aiTier].setupFee;
    } else {
      // Fallback to default values
      setupFee = inputs.aiTier === 'starter' ? 499 : inputs.aiTier === 'growth' ? 749 : 999;
    }
  } catch (error) {
    console.error("Error getting setup fee:", error);
    setupFee = inputs.aiTier === 'starter' ? 499 : inputs.aiTier === 'growth' ? 749 : 999;
  }
  
  // Calculate annual plan price
  let annualPlan = 0;
  try {
    if (aiRates.chatbot && 
        aiRates.chatbot[inputs.aiTier] && 
        'annualPrice' in aiRates.chatbot[inputs.aiTier]) {
      annualPlan = aiRates.chatbot[inputs.aiTier].annualPrice;
    } else {
      // Fallback to default values
      annualPlan = inputs.aiTier === 'starter' ? 990 : inputs.aiTier === 'growth' ? 2290 : 4290;
    }
  } catch (error) {
    console.error("Error getting annual plan price:", error);
    annualPlan = inputs.aiTier === 'starter' ? 990 : inputs.aiTier === 'growth' ? 2290 : 4290;
  }
  
  // Total monthly cost
  const totalMonthlyCost = tierBase + additionalVoiceCost;
  console.log("Total monthly cost:", totalMonthlyCost);
  
  return {
    tierBase,
    additionalVoiceCost,
    setupFee,
    annualPlan,
    totalMonthlyCost,
    extraVoiceMinutes
  };
}

/**
 * Calculate savings and percentages based on one employee replacement
 */
export function calculateSavings(humanCost: number, aiCost: number) {
  const monthlySavings = humanCost - aiCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCost > 0 ? (monthlySavings / humanCost) * 100 : 0;
  
  return {
    monthlySavings,
    yearlySavings,
    savingsPercentage
  };
}

/**
 * Calculate breakeven points
 */
export function calculateBreakEvenPoints(
  inputs: CalculatorInputs, 
  humanCosts: { hourlyRateWithBenefits: number },
  aiCosts: { totalMonthlyCost: number, extraVoiceMinutes: number }
) {
  return {
    voice: aiCosts.extraVoiceMinutes,
    chatbot: Math.ceil(aiCosts.totalMonthlyCost / ((humanCosts.hourlyRateWithBenefits) / 60))
  };
}

/**
 * Perform the full calculation and return the results
 */
export function performCalculations(
  inputs: CalculatorInputs, 
  aiRates: any
): CalculationResults {
  console.log("Performing full calculations with inputs:", inputs, "Using one employee replacement model");
  
  const validatedInputs = validateInputs(inputs);
  const humanHours = calculateHumanResources(validatedInputs);
  const humanCosts = calculateHumanCosts(validatedInputs, humanHours.monthlyTotal);
  const aiCosts = calculateAICosts(validatedInputs, aiRates);
  const savings = calculateSavings(humanCosts.monthlyHumanCost, aiCosts.totalMonthlyCost);
  const breakEvenPoint = calculateBreakEvenPoints(validatedInputs, humanCosts, aiCosts);
  
  const results = {
    aiCostMonthly: {
      voice: aiCosts.additionalVoiceCost,
      chatbot: aiCosts.tierBase,
      total: aiCosts.totalMonthlyCost,
      setupFee: aiCosts.setupFee
    },
    basePriceMonthly: aiCosts.tierBase,
    humanCostMonthly: humanCosts.monthlyHumanCost,
    monthlySavings: savings.monthlySavings,
    yearlySavings: savings.yearlySavings,
    savingsPercentage: savings.savingsPercentage,
    breakEvenPoint: breakEvenPoint,
    humanHours: humanHours,
    annualPlan: aiCosts.annualPlan,
    tierKey: validatedInputs.aiTier,
    aiType: validatedInputs.aiType
  };
  
  console.log("Final calculation results (one employee replacement model):", results);
  return results;
}
