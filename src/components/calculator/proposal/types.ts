
import jsPDF from 'jspdf';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { PricingDetail } from '../types';
import 'jspdf-autotable';

// Add custom interface to handle the jsPDF extension from autotable
export interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
  autoTable: (options: any) => JsPDFWithAutoTable;
}

export interface GenerateProposalParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: CalculationResults;
  tierName?: string;
  aiType?: string;
  pricingDetails?: PricingDetail[];
}
