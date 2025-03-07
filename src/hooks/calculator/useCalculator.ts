
import { useState, useEffect } from 'react';
import { fetchPricingRates } from './api';
import { performCalculations } from './calculations';
import { DEFAULT_AI_RATES } from '@/constants/pricing';
import type { CalculatorInputs, CalculationResults } from './types';

/**
 * Hook for calculating AI vs human cost comparisons
 */
export function useCalculator(inputs: CalculatorInputs): CalculationResults {
  const [results, setResults] = useState<CalculationResults>({
    aiCostMonthly: { voice: 0, chatbot: 0, total: 0, setupFee: 0 },
    basePriceMonthly: 0,
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
  
  const [aiRates, setAiRates] = useState(DEFAULT_AI_RATES);

  // Load pricing configurations from the database
  useEffect(() => {
    const loadPricing = async () => {
      const rates = await fetchPricingRates();
      setAiRates(rates);
      console.log("Loaded pricing configurations:", rates);
    };
    
    loadPricing();
  }, []);

  // Perform calculations when inputs or rates change
  useEffect(() => {
    console.log("Calculating with inputs:", inputs);
    console.log("Using AI rates:", aiRates);
    
    const calculationResults = performCalculations(inputs, aiRates);
    
    console.log("Final calculations:", calculationResults);
    setResults(calculationResults);
  }, [inputs, aiRates]);

  return results;
}
