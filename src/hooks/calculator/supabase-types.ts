import { CalculatorInputs, CalculationResults } from "./types";

/**
 * Converts JavaScript objects to JSON format for Supabase storage
 */
export function toJson(data: any): any {
  if (!data) return {};
  return JSON.parse(JSON.stringify(data));
}

/**
 * Parses JSON from Supabase into correct objects
 */
export function fromJson(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return {};
    }
  }
  return data || {};
}

/**
 * Provides default calculator inputs if none exist
 */
export function getDefaultCalculatorInputs(): CalculatorInputs {
  return {
    aiTier: 'growth',
    aiType: 'both',
    role: 'customerService',
    numEmployees: 5,
    callVolume: 0,
    avgCallDuration: 0,
    chatVolume: 2000,
    avgChatLength: 0,
    avgChatResolutionTime: 0
  };
}

/**
 * Provides default calculator results if none exist
 */
export function getDefaultCalculationResults(): CalculationResults {
  return {
    aiCostMonthly: {
      voice: 0,
      chatbot: 0,
      total: 0,
      setupFee: 749 // Default to growth tier setup fee
    },
    basePriceMonthly: 229, // Default to growth tier
    humanCostMonthly: 0,
    monthlySavings: 0,
    yearlySavings: 0,
    savingsPercentage: 0,
    breakEvenPoint: {
      voice: 0,
      chatbot: 0
    },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 0,
      monthlyTotal: 0,
      yearlyTotal: 0
    },
    annualPlan: 2290, // Default to growth tier annual plan
    includedVoiceMinutes: 600 // Default for growth tier
  };
}

/**
 * Ensures calculator results are complete with all required properties
 */
export function ensureCompleteCalculatorResults(results: any): CalculationResults {
  const defaultResults = getDefaultCalculationResults();
  
  if (!results) return defaultResults;
  
  return {
    aiCostMonthly: {
      voice: results.aiCostMonthly?.voice ?? defaultResults.aiCostMonthly.voice,
      chatbot: results.aiCostMonthly?.chatbot ?? defaultResults.aiCostMonthly.chatbot,
      total: results.aiCostMonthly?.total ?? defaultResults.aiCostMonthly.total,
      setupFee: results.aiCostMonthly?.setupFee ?? defaultResults.aiCostMonthly.setupFee
    },
    basePriceMonthly: results.basePriceMonthly ?? defaultResults.basePriceMonthly,
    humanCostMonthly: results.humanCostMonthly ?? defaultResults.humanCostMonthly,
    monthlySavings: results.monthlySavings ?? defaultResults.monthlySavings,
    yearlySavings: results.yearlySavings ?? defaultResults.yearlySavings,
    savingsPercentage: results.savingsPercentage ?? defaultResults.savingsPercentage,
    breakEvenPoint: {
      voice: results.breakEvenPoint?.voice ?? defaultResults.breakEvenPoint.voice,
      chatbot: results.breakEvenPoint?.chatbot ?? defaultResults.breakEvenPoint.chatbot
    },
    humanHours: {
      dailyPerEmployee: results.humanHours?.dailyPerEmployee ?? defaultResults.humanHours.dailyPerEmployee,
      weeklyTotal: results.humanHours?.weeklyTotal ?? defaultResults.humanHours.weeklyTotal,
      monthlyTotal: results.humanHours?.monthlyTotal ?? defaultResults.humanHours.monthlyTotal,
      yearlyTotal: results.humanHours?.yearlyTotal ?? defaultResults.humanHours.yearlyTotal
    },
    annualPlan: results.annualPlan ?? defaultResults.annualPlan,
    tierKey: results.tierKey || (results.basePriceMonthly === 99 ? 'starter' : 
                                results.basePriceMonthly === 429 ? 'premium' : 'growth'),
    aiType: results.aiType || 'both',
    includedVoiceMinutes: results.includedVoiceMinutes ?? (results.tierKey === 'starter' ? 0 : 600),
    additionalVoiceMinutes: results.additionalVoiceMinutes
  };
}

/**
 * Ensures calculator inputs conform to required type
 */
export function ensureCalculatorInputs(inputs: Record<string, any>): CalculatorInputs {
  if (!inputs) {
    return getDefaultCalculatorInputs();
  }

  return {
    aiType: inputs.aiType || 'chatbot',
    aiTier: inputs.aiTier || 'growth',
    role: inputs.role || 'customerService',
    numEmployees: typeof inputs.numEmployees === 'number' ? inputs.numEmployees : 1,
    callVolume: typeof inputs.callVolume === 'number' ? inputs.callVolume : 0,
    avgCallDuration: typeof inputs.avgCallDuration === 'number' ? inputs.avgCallDuration : 0,
    chatVolume: typeof inputs.chatVolume === 'number' ? inputs.chatVolume : 2000,
    avgChatLength: typeof inputs.avgChatLength === 'number' ? inputs.avgChatLength : 0,
    avgChatResolutionTime: typeof inputs.avgChatResolutionTime === 'number' ? inputs.avgChatResolutionTime : 0
  };
}
