
import { JsPDFWithAutoTable } from '../pdf/types';

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
  results: any;
  tierName?: string;
  aiType?: string;
  pricingDetails?: any[];
  additionalVoiceMinutes?: number;
}
