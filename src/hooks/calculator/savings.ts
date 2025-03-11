
import { CalculatorInputs } from './types';

/**
 * Calculate savings and percentages based on one employee replacement
 */
export function calculateSavings(humanCost: number, aiCost: number) {
  const monthlySavings = humanCost - aiCost;
  const yearlySavings = monthlySavings * 12;
  const savingsPercentage = humanCost > 0 ? (monthlySavings / humanCost) * 100 : 0;
  
  console.log("🧪 SAVINGS TEST:", {
    humanCost,
    aiCost,
    monthlySavings,
    yearlySavings,
    savingsPercentage: savingsPercentage.toFixed(2) + '%'
  });
  
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
