
import jsPDF from 'jspdf';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { BusinessSuggestion, AIPlacement } from '../types';

// Add custom interface to handle the jsPDF extension from autotable
export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

// Define a results type that includes all the properties used in the financialImpact section
export interface PDFResults {
  humanCostMonthly: number;
  aiCostMonthly: {
    voice?: number;
    chatbot?: number;
    total: number;
    setupFee?: number;
  };
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  breakEvenPoint?: {
    voice?: number;
    chatbot?: number;
  };
  humanHours?: {
    dailyPerEmployee?: number;
    weeklyTotal?: number;
    monthlyTotal?: number;
    yearlyTotal?: number;
  };
  annualPlan?: number;
  tierKey?: string;
  aiType?: string;
  [key: string]: any;
}

export interface GeneratePDFParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: PDFResults;
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  tierName?: string;
  aiType?: string;
  additionalVoiceMinutes?: number;
  includedVoiceMinutes?: number;
}
