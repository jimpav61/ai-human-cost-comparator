
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
export interface SharedResults {
  humanCostMonthly: number;
  aiCostMonthly: {
    voice: number;
    chatbot: number;
    total: number;
    setupFee: number;
  };
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
  tierKey?: string;
  aiType?: string;
  basePriceMonthly: number;
  [key: string]: any;
}

// Shared params for both PDF and proposal generation
export interface SharedGenerationParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: SharedResults;
  tierName?: string;
  aiType?: string;
  additionalVoiceMinutes?: number;
}
