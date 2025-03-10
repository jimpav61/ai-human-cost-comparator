
import type { Json } from '@/integrations/supabase/types';
import type { CalculatorInputs, CalculationResults } from './types';

// Helper function to safely cast our calculator types to Json for Supabase
export const toJson = <T>(data: T): Json => {
  if (!data) return null;
  
  try {
    // For objects that may contain special types, convert to plain JSON
    const serialized = JSON.parse(JSON.stringify(data));
    return serialized as Json;
  } catch (e) {
    console.error('Failed to convert data to JSON:', e);
    return null;
  }
};

// Helper function to cast Json back to our calculator types with proper type safety
export const fromJson = <T>(json: Json): T => {
  if (!json) {
    // Return an empty object cast to the expected type if null
    return {} as T;
  }
  
  try {
    // If it's already an object, just return it with the expected type
    if (typeof json === 'object' && json !== null) {
      return json as unknown as T;
    }
    
    // If it's a string, try to parse it
    if (typeof json === 'string') {
      return JSON.parse(json) as T;
    }
    
    return {} as T;
  } catch (e) {
    console.error('Failed to convert JSON to object:', e);
    return {} as T;
  }
};

// Helper to ensure a default for CalculatorInputs when none exists
export const getDefaultCalculatorInputs = (): CalculatorInputs => {
  return {
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: 5,
    callVolume: 0,
    avgCallDuration: 5,
    chatVolume: 2000,
    avgChatLength: 3,
    avgChatResolutionTime: 10
  };
};

// Helper to ensure a default for CalculationResults when none exists
export const getDefaultCalculationResults = (): CalculationResults => {
  return {
    aiCostMonthly: { voice: 0, chatbot: 0, total: 0, setupFee: 0 },
    basePriceMonthly: 0,
    humanCostMonthly: 0,
    monthlySavings: 0,
    yearlySavings: 0,
    savingsPercentage: 0,
    breakEvenPoint: { voice: 0, chatbot: 0 },
    humanHours: {
      dailyPerEmployee: 0,
      weeklyTotal: 0,
      monthlyTotal: 0,
      yearlyTotal: 0
    },
    annualPlan: 0,
    tierKey: 'growth',
    aiType: 'chatbot'
  };
};
