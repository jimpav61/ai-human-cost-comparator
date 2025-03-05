import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import { PricingDetail } from '../types';
import { addBranding } from './sections/branding';
import { addIntroduction } from './sections/introduction';
import { addIndustryChallenges } from './sections/industryChallenges';
import { addRecommendedSolution } from './sections/recommendedSolution';
import { addValueProposition } from './sections/valueProposition';
import { addFinancialImpact } from './sections/financialImpact';
import { addImplementationProcess } from './sections/implementationProcess';
import { addNextSteps } from './sections/nextSteps';
import { addAdditionalResources } from './sections/additionalResources';
import { addContactInformation } from './sections/contactInformation';
import { addFooter } from './sections/footer';
import { JsPDFWithAutoTable, SharedResults } from '../shared/types';
import { GenerateProposalParams } from './types';

export const generateProposal = (params: GenerateProposalParams) => {
  console.log('Generating proposal with params:', params);
  
  // Ensure results has the expected structure to prevent errors
  const defaultResults = {
    aiCostMonthly: {
      voice: 0,
      chatbot: 0,
      total: 0,
      setupFee: 0
    },
    humanCostMonthly: 0,
    monthlySavings: 0,
    yearlySavings: 0,
    savingsPercentage: 0,
    breakEvenPoint: {
      voice: 0,
      chatbot: 0
    },
    humanHours: {
      dailyPerEmployee: 8,
      weeklyTotal: 40,
      monthlyTotal: 160,
      yearlyTotal: 2080
    },
    annualPlan: 0,
    basePriceMonthly: 0
  };
  
  // Extract tier and AI type information from params
  const tierName = params.tierName || 'Growth Plan';
  const aiType = params.aiType || 'Text Only';
  
  // Determine tier key for additional properties
  const tierKey = tierName.toLowerCase().includes('starter') ? 'starter' : 
                 tierName.toLowerCase().includes('growth') ? 'growth' : 
                 tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
                 
  // Determine AI type key
  const aiTypeKey = aiType.toLowerCase().includes('text only') ? 'chatbot' :
                   aiType.toLowerCase().includes('voice') ? 'voice' : 'chatbot';
  
  // Merge provided results with default values to ensure all required properties exist
  // Also, ensure all values are numbers, not strings or undefined
  const safeResults = {
    ...defaultResults,
    humanCostMonthly: Number(params.results?.humanCostMonthly) || defaultResults.humanCostMonthly,
    monthlySavings: Number(params.results?.monthlySavings) || defaultResults.monthlySavings,
    yearlySavings: Number(params.results?.yearlySavings) || defaultResults.yearlySavings,
    savingsPercentage: Number(params.results?.savingsPercentage) || defaultResults.savingsPercentage,
    annualPlan: Number(params.results?.annualPlan) || defaultResults.annualPlan,
    basePriceMonthly: Number(params.results?.basePriceMonthly) || defaultResults.basePriceMonthly,
    aiCostMonthly: {
      voice: Number(params.results?.aiCostMonthly?.voice) || defaultResults.aiCostMonthly.voice,
      chatbot: Number(params.results?.aiCostMonthly?.chatbot) || defaultResults.aiCostMonthly.chatbot,
      total: Number(params.results?.aiCostMonthly?.total) || defaultResults.aiCostMonthly.total,
      setupFee: Number(params.results?.aiCostMonthly?.setupFee) || defaultResults.aiCostMonthly.setupFee
    },
    breakEvenPoint: {
      voice: Number(params.results?.breakEvenPoint?.voice) || defaultResults.breakEvenPoint.voice,
      chatbot: Number(params.results?.breakEvenPoint?.chatbot) || defaultResults.breakEvenPoint.chatbot
    },
    humanHours: {
      dailyPerEmployee: Number(params.results?.humanHours?.dailyPerEmployee) || defaultResults.humanHours.dailyPerEmployee,
      weeklyTotal: Number(params.results?.humanHours?.weeklyTotal) || defaultResults.humanHours.weeklyTotal,
      monthlyTotal: Number(params.results?.humanHours?.monthlyTotal) || defaultResults.humanHours.monthlyTotal,
      yearlyTotal: Number(params.results?.humanHours?.yearlyTotal) || defaultResults.humanHours.yearlyTotal
    },
    tierKey: tierKey,
    aiType: aiTypeKey
  } as SharedResults;
  
  console.log("Proposal generation - sanitized results:", safeResults);
  console.log("Proposal generation - additionalVoiceMinutes:", params.additionalVoiceMinutes);
  
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const reportDate = new Date().toLocaleDateString();
  let yPosition = 20;

  // Add document sections with the safe results
  const safeParams = { ...params, results: safeResults };
  
  yPosition = addBranding(doc, yPosition);
  yPosition = addIntroduction(doc, yPosition, safeParams);
  yPosition = addIndustryChallenges(doc, yPosition, safeParams);
  yPosition = addRecommendedSolution(doc, yPosition, safeParams);
  yPosition = addValueProposition(doc, yPosition);
  yPosition = addFinancialImpact(doc, yPosition, safeParams);
  yPosition = addImplementationProcess(doc, yPosition);
  yPosition = addNextSteps(doc, yPosition);
  
  // Add a new page for contact information and additional resources
  doc.addPage();
  yPosition = 20;
  
  yPosition = addAdditionalResources(doc, yPosition);
  yPosition = addContactInformation(doc, yPosition);
  addFooter(doc, safeParams, reportDate);

  return doc;
};
