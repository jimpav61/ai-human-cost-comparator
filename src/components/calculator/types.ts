
import type { CalculationResults, CalculatorInputs } from '@/hooks/useCalculator';

export interface LeadData {
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string;
}

export interface ResultsDisplayProps {
  results: CalculationResults;
  onGenerateReport: () => void;
  reportGenerated: boolean;
  inputs: CalculatorInputs;
  leadData: LeadData;
}

export interface PricingDetail {
  title: string;
  base: number | null;
  rate: string;
  totalMinutes?: number;
  totalMessages?: number;
  monthlyCost: number;
}

export interface BusinessSuggestion {
  title: string;
  description: string;
}

export interface AIPlacement {
  role: string;
  capabilities: string[];
}
