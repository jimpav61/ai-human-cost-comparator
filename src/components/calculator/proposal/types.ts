
import { JsPDFWithAutoTable as PDFWithAutoTable } from '../pdf/types';

// Re-export the JsPDFWithAutoTable type
export type JsPDFWithAutoTable = PDFWithAutoTable;

// Define the results interface that both proposal and PDF generation will use
export interface ProposalResults {
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

// Define the SectionParams interface and export it
export interface SectionParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: ProposalResults;
  tierName?: string;
  aiType?: string;
}

export interface PricingTableRow {
  item: string;
  cost: string;
}

export interface GenerateProposalParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: ProposalResults;
  tierName?: string;
  aiType?: string;
  pricingDetails?: any[];
  additionalVoiceMinutes?: number;
}
