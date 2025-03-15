
import { AI_RATES } from "@/constants/pricing";
import { CalculatorInputs, CalculationResults } from "./types";

/**
 * Ensures calculator results have all required properties for PDF generation
 */
export function ensureCompleteCalculatorResults(calculatorResults: any): any {
  // Use calculator_results if it exists, otherwise create empty object
  const results = calculatorResults || {};
  
  // Get tier key with fallback
  const tierKey = results.tierKey || 'growth';
  
  // Get AI type with fallback 
  const aiType = results.aiType || 'both';
  
  // Calculate included voice minutes based on tier
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  console.log(" /////////////////////////////// tierKey ", tierKey)
  console.log(" /////////////////////////////// includedVoiceMinutes ", includedVoiceMinutes)
  
  // Ensure aiCostMonthly exists with all required properties
  results.aiCostMonthly = results.aiCostMonthly || {};
  
  // Base price fallbacks
  const basePrice = results.basePriceMonthly || AI_RATES.chatbot[tierKey].base;
  
  // Make sure key financial values exist
  if (!results.aiCostMonthly.setupFee) {
    results.aiCostMonthly.setupFee = AI_RATES.chatbot[tierKey].setupFee;
  }
  
  // Ensure we have voice costs
  if (typeof results.aiCostMonthly.voice !== 'number') {
    results.aiCostMonthly.voice = 0;
  }
  
  // Ensure we have chatbot costs
  if (typeof results.aiCostMonthly.chatbot !== 'number') {
    results.aiCostMonthly.chatbot = basePrice;
  }
  
  // Make sure total cost exists
  if (typeof results.aiCostMonthly.total !== 'number') {
    results.aiCostMonthly.total = results.aiCostMonthly.chatbot + results.aiCostMonthly.voice;
  }
  
  // Set base price
  if (typeof results.basePriceMonthly !== 'number') {
    results.basePriceMonthly = basePrice;
  }
  
  // Ensure we have additionalVoiceMinutes
  if (typeof results.additionalVoiceMinutes !== 'number') {
    results.additionalVoiceMinutes = 0;
  }
  
  // Ensure we have includedVoiceMinutes
  if (typeof results.includedVoiceMinutes !== 'number') {
    results.includedVoiceMinutes = includedVoiceMinutes;
  }
  
  // Ensure humanCostMonthly exists
  if (typeof results.humanCostMonthly !== 'number') {
    results.humanCostMonthly = 3800;
  }
  
  // Calculate savings if they don't exist
  if (typeof results.monthlySavings !== 'number') {
    results.monthlySavings = results.humanCostMonthly - results.aiCostMonthly.total;
  }
  
  if (typeof results.yearlySavings !== 'number') {
    results.yearlySavings = results.monthlySavings * 12;
  }
  
  if (typeof results.savingsPercentage !== 'number') {
    results.savingsPercentage = (results.monthlySavings / results.humanCostMonthly) * 100;
  }
  
  // Ensure breakEvenPoint exists
  if (!results.breakEvenPoint) {
    results.breakEvenPoint = { 
      voice: results.additionalVoiceMinutes || 0, 
      chatbot: 500 
    };
  }
  
  // Ensure humanHours exists with all properties
  if (!results.humanHours) {
    results.humanHours = {
      dailyPerEmployee: 8,
      weeklyTotal: 200,
      monthlyTotal: 850,
      yearlyTotal: 10200
    };
  }
  
  return {
    ...results,
    tierKey,
    aiType,
    includedVoiceMinutes,
    additionalVoiceMinutes: results.additionalVoiceMinutes || 0
  };
}

/**
 * Convert value to JSON string for Supabase storage
 */
export function toJson(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error("Error converting to JSON:", error);
    return "{}";
  }
}

/**
 * Parse JSON string from Supabase
 */
export function fromJson(jsonString: string | null): any {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

/**
 * Get default calculator inputs
 */
export function getDefaultCalculatorInputs(): CalculatorInputs {
  return {
    aiType: 'both',
    aiTier: 'growth',
    role: 'customerService',
    numEmployees: 10,
    callVolume: 0,
    avgCallDuration: 3,
    chatVolume: 5000,
    avgChatLength: 5,
    avgChatResolutionTime: 10
  };
}

/**
 * Get default calculation results
 */
export function getDefaultCalculationResults(): CalculationResults {
  return {
    aiCostMonthly: {
      voice: 0,
      chatbot: 229,
      total: 229,
      setupFee: 500
    },
    basePriceMonthly: 229,
    humanCostMonthly: 3800,
    monthlySavings: 3571,
    yearlySavings: 42852,
    savingsPercentage: 94,
    breakEvenPoint: {
      voice: 0,
      chatbot: 500
    },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 200,
      monthlyTotal: 850,
      yearlyTotal: 10200
    },
    annualPlan: 2748,
    includedVoiceMinutes: 600,
    additionalVoiceMinutes: 0,
    tierKey: 'growth',
    aiType: 'both'
  };
}
