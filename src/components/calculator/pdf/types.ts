
import { JsPDFWithAutoTable, SharedResults } from '../shared/types';
import type { BusinessSuggestion, AIPlacement } from '../types';
import type { CalculationResults } from '@/hooks/useCalculator';

// Re-export the shared types
export type { JsPDFWithAutoTable, CalculationResults, SharedResults };

// Define PDFResults for the financialImpact section
export type PDFResults = CalculationResults | SharedResults;

// Extend the shared params with PDF-specific properties
export interface GeneratePDFParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: CalculationResults | SharedResults;
  tierName?: string;
  aiType?: string;
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  includedVoiceMinutes?: number;
  additionalVoiceMinutes?: number;
}
