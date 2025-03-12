
import { Lead } from "@/types/leads";
import { CalculationResults, CalculatorInputs } from "@/hooks/calculator/types";
import { supabase } from "@/integrations/supabase/client";

interface LeadInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  industry: string | null;
  companySize: number | null;
}

interface ProposalData {
  leadInfo: LeadInfo;
  planDetails: {
    name: string;
    setupFee: number;
    monthlyPrice: number;
    includedVoiceMinutes: number;
    additionalVoiceMinutes: number;
    additionalVoiceMinutesCost: number;
    annualPrice: number;
    aiType: string;
  };
  costComparison: {
    currentMonthlyCost: number;
    aiMonthlyCost: number;
    monthlySavings: number;
    annualSavings: number;
    savingsPercentage: number;
  };
  roiDetails: {
    breakEvenMonths: number;
    firstYearROI: number;
    fiveYearSavings: number;
  };
}

/**
 * Validates calculator results to ensure we have actual data
 */
function validateCalculatorResults(results: any): asserts results is CalculationResults {
  if (!results || typeof results !== 'object') {
    throw new Error('Calculator results are missing or invalid');
  }
  
  const requiredFields = ['tierKey', 'aiType', 'basePriceMonthly', 'humanCostMonthly'];
  const missingFields = requiredFields.filter(field => !(field in results));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required calculator fields: ${missingFields.join(', ')}`);
  }
}

/**
 * Generates a proposal using the exact values from the calculator
 */
export function generateProposal(lead: Lead): ProposalData {
  // Debug log the lead data
  console.log('Generating proposal for lead:', {
    id: lead.id,
    companyName: lead.company_name,
    calculatorResults: lead.calculator_results
  });
  
  // Validate calculator results
  validateCalculatorResults(lead.calculator_results);
  
  // Extract values from calculator results
  const {
    tierKey = 'growth',
    aiType = 'both',
    basePriceMonthly = 0,
    humanCostMonthly = 0,
    monthlySavings = 0,
    yearlySavings = 0,
    savingsPercentage = 0,
    annualPlan = 0,
    aiCostMonthly = { setupFee: 0, voice: 0 }
  } = lead.calculator_results;
  
  // Get tier display name
  const tierNames = {
    'starter': 'Starter Plan - Text Only',
    'growth': 'Growth Plan - Text & Basic Voice',
    'premium': 'Premium Plan - Text & Conversational Voice'
  };
  
  const tierName = tierNames[tierKey as keyof typeof tierNames] || 'Custom Plan';
  
  // Calculate voice minutes
  const includedVoiceMinutes = tierKey === 'starter' ? 0 : 600;
  const additionalVoiceMinutes = Math.round((aiCostMonthly?.voice || 0) / 0.12);
  
  return {
    leadInfo: {
      companyName: lead.company_name,
      contactName: lead.name,
      email: lead.email,
      phone: lead.phone_number,
      industry: lead.industry,
      companySize: lead.employee_count
    },
    planDetails: {
      name: tierName,
      setupFee: aiCostMonthly.setupFee,
      monthlyPrice: basePriceMonthly,
      includedVoiceMinutes,
      additionalVoiceMinutes,
      additionalVoiceMinutesCost: aiCostMonthly.voice || 0,
      annualPrice: annualPlan,
      aiType
    },
    costComparison: {
      currentMonthlyCost: humanCostMonthly,
      aiMonthlyCost: basePriceMonthly + (aiCostMonthly.voice || 0),
      monthlySavings,
      annualSavings: yearlySavings,
      savingsPercentage
    },
    roiDetails: {
      breakEvenMonths: Math.ceil(aiCostMonthly.setupFee / monthlySavings) || 1,
      firstYearROI: Math.round((yearlySavings - aiCostMonthly.setupFee) / aiCostMonthly.setupFee * 100) || 0,
      fiveYearSavings: yearlySavings * 5
    }
  };
}
