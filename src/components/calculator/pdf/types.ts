
import { JsPDFWithAutoTable, SharedResults, ensureCompleteResults } from '../shared/types';
import type { BusinessSuggestion, AIPlacement } from '../types';
import type { CalculationResults } from '@/hooks/useCalculator';

// Re-export the shared types
export type { JsPDFWithAutoTable, CalculationResults, SharedResults };
export { ensureCompleteResults };

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

// Helper function to ensure we get a valid CalculationResults object
// regardless of whether we received CalculationResults or SharedResults
export function ensureCalculationResults(results: Partial<CalculationResults | SharedResults>): CalculationResults {
  // Create a complete results object first
  const completeResults = ensureCompleteResults(results as Partial<SharedResults>);
  
  // Ensure tierKey is a valid value
  const validTierKey = (completeResults.tierKey || 'growth') as "starter" | "growth" | "premium";
  
  // Ensure aiType is a valid value
  const validAiType = completeResults.aiType || 'chatbot';
  
  // Return with specific casting to CalculationResults
  return {
    ...completeResults,
    tierKey: validTierKey,
    aiType: validAiType
  } as CalculationResults;
}
