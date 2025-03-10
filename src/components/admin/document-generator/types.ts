
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
// Make sure tierKey uses the same type as in CalculationResults
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
  tierKey?: "starter" | "growth" | "premium";
  aiType?: "voice" | "chatbot" | "both" | "conversationalVoice" | "both-premium";
}
