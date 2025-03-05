
import { Lead } from "@/types/leads";
import { AI_RATES } from "@/constants/pricing";
import { calculatePricingDetails, getTierDisplayName, getAITypeDisplay } from "@/components/calculator/pricingDetailsCalculator";

export interface ProcessedLeadData {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: any;
  tierName: string;
  aiType: string;
  additionalVoiceMinutes: number;
  includedVoiceMinutes: number;
  businessSuggestions: Array<{
    title: string;
    description: string;
  }>;
  aiPlacements: Array<{
    role: string;
    capabilities: string[];
  }>;
}

export const processLeadData = (lead: Lead): ProcessedLeadData => {
  // Use the calculator inputs from lead or fallback to defaults
  const inputs = lead.calculator_inputs || {
    aiType: 'chatbot',
    aiTier: 'starter',
    role: 'customerService',
    numEmployees: lead.employee_count || 5,
    callVolume: 0, 
    avgCallDuration: 0,
    chatVolume: 2000,
    avgChatLength: 8,
    avgChatResolutionTime: 10
  };
  
  // Get the tier from the lead's original inputs
  const tierToUse = inputs.aiTier || 'starter';
  const aiTypeToUse = inputs.aiType || 'chatbot';
  
  // Setup fee from rates using the original tier
  const setupFee = AI_RATES.chatbot[tierToUse].setupFee;
  
  // Get included voice minutes based on tier
  const includedVoiceMinutes = tierToUse === 'starter' ? 0 : 600;
  
  // inputs.callVolume now directly represents the additional minutes
  const extraVoiceMinutes = inputs.callVolume || 0;
  let additionalVoiceCost = 0;
  
  if (extraVoiceMinutes > 0 && tierToUse !== 'starter') {
    // Always use 12¢ per minute for additional voice minutes
    const additionalMinuteRate = 0.12;
    additionalVoiceCost = extraVoiceMinutes * additionalMinuteRate;
  }
  
  // Get base cost from the tier
  const baseMonthlyPrice = AI_RATES.chatbot[tierToUse].base;
  
  // Use the calculator results from lead or create a complete default object based on the ORIGINAL tier
  const results = lead.calculator_results || {
    aiCostMonthly: { 
      voice: additionalVoiceCost, 
      chatbot: baseMonthlyPrice, 
      total: baseMonthlyPrice + additionalVoiceCost, 
      setupFee: setupFee
    },
    basePriceMonthly: baseMonthlyPrice,
    humanCostMonthly: 3800,
    monthlySavings: 3800 - (baseMonthlyPrice + additionalVoiceCost),
    yearlySavings: (3800 - (baseMonthlyPrice + additionalVoiceCost)) * 12,
    savingsPercentage: ((3800 - (baseMonthlyPrice + additionalVoiceCost)) / 3800) * 100,
    breakEvenPoint: { voice: extraVoiceMinutes, chatbot: 520 },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 200,
      monthlyTotal: 850,
      yearlyTotal: 10200
    },
    annualPlan: AI_RATES.chatbot[tierToUse].annualPrice
  };
  
  // Ensure all nested objects and properties exist to prevent undefined errors
  if (!results.aiCostMonthly) {
    results.aiCostMonthly = { 
      voice: additionalVoiceCost, 
      chatbot: baseMonthlyPrice, 
      total: baseMonthlyPrice + additionalVoiceCost,
      setupFee: setupFee 
    };
  }
  
  if (!results.breakEvenPoint) {
    results.breakEvenPoint = { voice: extraVoiceMinutes, chatbot: 520 };
  }
  
  if (!results.humanHours) {
    results.humanHours = {
      dailyPerEmployee: 8,
      weeklyTotal: 200,
      monthlyTotal: 850,
      yearlyTotal: 10200
    };
  }
  
  // Ensure basePriceMonthly is set
  if (!results.basePriceMonthly) {
    results.basePriceMonthly = baseMonthlyPrice;
  }
  
  // Get display names based on the ORIGINAL tier and aiType
  const tierName = getTierDisplayName(tierToUse);
  const aiType = getAITypeDisplay(aiTypeToUse);

  return {
    contactInfo: lead.name || 'Valued Client',
    companyName: lead.company_name || 'Your Company',
    email: lead.email || 'client@example.com',
    phoneNumber: lead.phone_number || '',
    industry: lead.industry || 'Other',
    employeeCount: lead.employee_count || 5,
    results,
    tierName,
    aiType,
    additionalVoiceMinutes: extraVoiceMinutes,
    includedVoiceMinutes,
    businessSuggestions: [
      {
        title: "Automate Common Customer Inquiries",
        description: "Implement an AI chatbot to handle frequently asked questions, reducing wait times and freeing up human agents."
      },
      {
        title: "Enhance After-Hours Support",
        description: "Deploy voice AI to provide 24/7 customer service without increasing staffing costs."
      },
      {
        title: "Streamline Onboarding Process",
        description: "Use AI assistants to guide new customers through product setup and initial questions."
      }
    ],
    aiPlacements: [
      {
        role: "Front-line Customer Support",
        capabilities: ["Handle basic inquiries", "Process simple requests", "Collect customer information"]
      },
      {
        role: "Technical Troubleshooting",
        capabilities: ["Guide users through common issues", "Recommend solutions based on symptoms", "Escalate complex problems to human agents"]
      },
      {
        role: "Sales Assistant",
        capabilities: ["Answer product questions", "Provide pricing information", "Schedule demonstrations with sales team"]
      }
    ]
  };
};
