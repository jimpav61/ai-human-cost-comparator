
import { JsPDFWithAutoTable } from '../shared/types';
import type { BusinessSuggestion, AIPlacement } from '../types';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { SharedGenerationParams } from '../shared/types';

// Re-export the shared types
export type { JsPDFWithAutoTable, CalculationResults };

// Define PDFResults for the financialImpact section
export type PDFResults = CalculationResults;

// Extend the shared params with PDF-specific properties
export interface GeneratePDFParams extends SharedGenerationParams {
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  includedVoiceMinutes?: number;
  additionalVoiceMinutes?: number;
}
