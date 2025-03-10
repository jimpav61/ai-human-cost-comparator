
import { Lead } from "@/types/leads";

export interface DocumentGeneratorProps {
  lead: Lead;
}

export interface UseDownloadStateProps {
  id: string;
  leadId?: string; // Added to support existing code that uses leadId
  storageKey?: string;
}

export interface UseDownloadStateReturn {
  hasDownloaded: boolean;
  markAsDownloaded: () => void;
  downloadedItems: Set<string>;
}

// Adding SharedResults type for proposal generator compatibility
export interface SharedResults {
  aiCostMonthly: {
    voice: number;
    chatbot: number;
    total: number;
    setupFee: number;
  };
  basePriceMonthly: number;
  humanCostMonthly: number;
  monthlySavings: number;
  yearlySavings: number;
  savingsPercentage: number;
  breakEvenPoint: {
    voice: number;
    chatbot: number;
  };
  humanHours: {
    dailyPerEmployee: number;
    weeklyTotal: number;
    monthlyTotal: number;
    yearlyTotal: number;
  };
  annualPlan: number;
  tierKey?: string;
  aiType?: string;
}
