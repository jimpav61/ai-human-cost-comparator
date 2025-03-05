
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
export interface SharedResults extends CalculationResults {
  tierKey?: string;
  aiType?: string;
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
  results: SharedResults | CalculationResults;
  tierName?: string;
  aiType?: string;
  additionalVoiceMinutes?: number;
}
