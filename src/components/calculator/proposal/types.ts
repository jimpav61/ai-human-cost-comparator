
import { SharedResults, SharedGenerationParams, JsPDFWithAutoTable } from '../shared/types';

// Re-export the shared types
export type { JsPDFWithAutoTable };

// Use the shared results type
export type ProposalResults = SharedResults;

// Define the SectionParams interface and export it
export interface SectionParams extends SharedGenerationParams {}

export interface PricingTableRow {
  item: string;
  cost: string;
}

// Extend the shared params with proposal-specific properties
export interface GenerateProposalParams extends SharedGenerationParams {
  pricingDetails?: any[];
}
