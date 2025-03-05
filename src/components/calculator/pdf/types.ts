
import { SharedResults, SharedGenerationParams, JsPDFWithAutoTable } from '../shared/types';
import type { BusinessSuggestion, AIPlacement } from '../types';

// Re-export the shared types
export type { JsPDFWithAutoTable };

// Use the shared results type
export type PDFResults = SharedResults;

// Extend the shared params with PDF-specific properties
export interface GeneratePDFParams extends SharedGenerationParams {
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  includedVoiceMinutes?: number;
}
