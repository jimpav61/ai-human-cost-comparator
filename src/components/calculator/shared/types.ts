
import jsPDF from 'jspdf';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { BusinessSuggestion, AIPlacement } from '../types';

// Add custom interface to handle the jsPDF extension from autotable
export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

// Define a shared results type that both PDF and proposal generation can use
// Make sure to properly extend CalculationResults with correct types
export interface SharedResults {
  aiCostMonthly: {
    voice: number;
    chatbot: number;
    total: number;
    setupFee: number;
  };
  basePriceMonthly: number;
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
  // Using the exact same type as in CalculationResults
  tierKey?: "starter" | "growth" | "premium";
  aiType?: "voice" | "chatbot" | "both" | "conversationalVoice" | "both-premium";
  includedVoiceMinutes?: number;
  [key: string]: any; // Allow additional properties
}

// Shared params for both PDF and proposal generation
export interface SharedGenerationParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: SharedResults | CalculationResults;
  tierName?: string;
  aiType?: string;
  additionalVoiceMinutes?: number;
  includedVoiceMinutes?: number;
}
