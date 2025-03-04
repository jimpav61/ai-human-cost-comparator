
export interface BusinessSuggestion {
  title: string;
  description: string;
}

export interface AIPlacement {
  role: string;
  capabilities: string[];
}

export interface LeadData {
  id?: string;
  name: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  website?: string;
  calculator_inputs?: Record<string, any>;
  calculator_results?: Record<string, any>;
}

export interface PricingDetail {
  title: string;
  base: number | null;
  rate: string;
  totalMessages?: number | null;
  totalMinutes?: number | null;
  monthlyCost: number;
}

export interface ResultsDisplayProps {
  results: any;
  onGenerateReport: () => void;
  reportGenerated: boolean;
  inputs: any;
  leadData: LeadData;
}
