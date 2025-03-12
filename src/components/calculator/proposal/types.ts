
import { SharedResults, SharedGenerationParams, JsPDFWithAutoTable } from '../shared/types';

// Re-export the shared types
export type { JsPDFWithAutoTable };

// Use the shared results type
export type ProposalResults = SharedResults;

// Extend the shared params with proposal-specific properties
export interface GenerateProposalParams extends SharedGenerationParams {
  pricingDetails?: any[];
}

// Define the SectionParams interface as an extension of SharedGenerationParams
export interface SectionParams extends SharedGenerationParams {
  // Add any additional section-specific parameters here
}

export interface PricingTableRow {
  item: string;
  cost: string;
}
