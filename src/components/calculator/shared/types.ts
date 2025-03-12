
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
  tierKey?: 'starter' | 'growth' | 'premium';
  aiType?: 'voice' | 'chatbot' | 'both' | 'conversationalVoice' | 'both-premium';
  includedVoiceMinutes: number;
  additionalVoiceMinutes?: number;
}

// Helper function to ensure we have complete results
export function ensureCompleteResults(results: Partial<SharedResults>): SharedResults {
  return {
    aiCostMonthly: {
      voice: results.aiCostMonthly?.voice ?? 0,
      chatbot: results.aiCostMonthly?.chatbot ?? 0,
      total: results.aiCostMonthly?.total ?? 0,
      setupFee: results.aiCostMonthly?.setupFee ?? 749
    },
    basePriceMonthly: results.basePriceMonthly ?? 229,
    humanCostMonthly: results.humanCostMonthly ?? 0,
    monthlySavings: results.monthlySavings ?? 0,
    yearlySavings: results.yearlySavings ?? 0,
    savingsPercentage: results.savingsPercentage ?? 0,
    breakEvenPoint: {
      voice: results.breakEvenPoint?.voice ?? 0,
      chatbot: results.breakEvenPoint?.chatbot ?? 0
    },
    humanHours: {
      dailyPerEmployee: results.humanHours?.dailyPerEmployee ?? 8,
      weeklyTotal: results.humanHours?.weeklyTotal ?? 0,
      monthlyTotal: results.humanHours?.monthlyTotal ?? 0,
      yearlyTotal: results.humanHours?.yearlyTotal ?? 0
    },
    annualPlan: results.annualPlan ?? 2290,
    tierKey: results.tierKey ?? 'growth',
    aiType: results.aiType ?? 'both',
    includedVoiceMinutes: results.includedVoiceMinutes ?? 600,
    additionalVoiceMinutes: results.additionalVoiceMinutes ?? 0
  };
}
