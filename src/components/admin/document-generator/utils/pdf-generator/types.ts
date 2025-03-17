
import { Lead } from "@/types/leads";

export interface PdfContentParams {
  brandRed: string;
  companyName: string;
  contactName: string;
  email: string;
  phoneNumber: string;
  industry: string;
  website: string;
  employeeCount: number;
  aiTier: string;
  aiType: string;
  tierName: string;
  aiTypeDisplay: string;
  basePrice: number;
  includedMinutes: number;
  callVolume: number;
  voiceCost: number;
  totalPrice: number;
  setupFee: number;
  humanCostMonthly: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  annualPlan: boolean;
  formattedDate: string;
}
