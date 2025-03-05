
import { JsPDFWithAutoTable } from '../shared/types';
import type { BusinessSuggestion, AIPlacement } from '../types';
import type { CalculationResults } from '@/hooks/useCalculator';

// Re-export the shared types
export type { JsPDFWithAutoTable, CalculationResults };

// Extend the shared params with PDF-specific properties
export interface GeneratePDFParams extends SharedGenerationParams {
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  includedVoiceMinutes?: number;
  additionalVoiceMinutes?: number;
}

