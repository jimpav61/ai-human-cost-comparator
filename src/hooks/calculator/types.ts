
import { AIRates } from '@/constants/pricing';

export interface CalculatorInputs {
  aiType: 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium';
  aiTier: 'starter' | 'growth' | 'premium';
  role: 'customerService' | 'sales' | 'technicalSupport' | 'generalAdmin';
  numEmployees: number;
  callVolume: number;
  avgCallDuration: number; // Keep for backward compatibility, but no longer used
  chatVolume: number;
  avgChatLength: number; // Keep for backward compatibility, but no longer used
  avgChatResolutionTime: number; // Keep for backward compatibility, but no longer used
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
  // Adding these properties for proposal generator compatibility
  tierKey?: 'starter' | 'growth' | 'premium';
  aiType?: 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium';
}

export type CalculatorState = CalculationResults;
