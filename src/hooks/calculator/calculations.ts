
import { CalculatorInputs, CalculationResults } from './types';
import { validateInputs } from './validation';
import { calculateHumanResources, calculateHumanCosts } from './humanResources';
import { calculateAICosts } from './aiCosts';
import { calculateSavings, calculateBreakEvenPoints } from './savings';

/**
 * Perform the full calculation and return the results
 */
export function performCalculations(
  inputs: CalculatorInputs, 
  aiRates: any
): CalculationResults {
  console.log("🧪 TEST SCENARIO:", {
    model: "One chatbot replaces one human",
    employeeCount: inputs.numEmployees,
    role: inputs.role,
    aiTier: inputs.aiTier,
    aiType: inputs.aiType
  });
  
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
  
  console.log("🧪 FINAL TEST RESULTS:", {
    employeesBeforeAI: validatedInputs.numEmployees,
    employeesAfterAI: Math.max(validatedInputs.numEmployees - 1, 0),
    role: validatedInputs.role,
    aiPlan: `${validatedInputs.aiTier} (${validatedInputs.aiType})`,
    monthlyHumanCost: results.humanCostMonthly,
    monthlyAICost: results.aiCostMonthly.total,
    monthlySavings: results.monthlySavings,
    yearlySavings: results.yearlySavings,
    savingsPercentage: results.savingsPercentage.toFixed(2) + '%'
  });
  
  return results;
}
