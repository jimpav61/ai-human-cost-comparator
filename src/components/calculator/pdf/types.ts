
import jsPDF from 'jspdf';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { BusinessSuggestion, AIPlacement } from '../types';

// Add custom interface to handle the jsPDF extension from autotable
export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

export interface GeneratePDFParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: CalculationResults;
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  tierName?: string;
  aiType?: string;
  additionalVoiceMinutes?: number;
  includedVoiceMinutes?: number;
}
