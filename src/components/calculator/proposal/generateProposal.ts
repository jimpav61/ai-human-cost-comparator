
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
import { JsPDFWithAutoTable } from './types';
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
      weeklyTotal: 0,
      monthlyTotal: 0,
      yearlyTotal: 0
    },
    annualPlan: 0,
    basePriceMonthly: 0
  };
  
  // Merge provided results with default values to ensure all required properties exist
  const safeResults = {
    ...defaultResults,
    ...params.results,
    aiCostMonthly: {
      ...defaultResults.aiCostMonthly,
      ...(params.results?.aiCostMonthly || {})
    },
    breakEvenPoint: {
      ...defaultResults.breakEvenPoint,
      ...(params.results?.breakEvenPoint || {})
    },
    humanHours: {
      ...defaultResults.humanHours,
      ...(params.results?.humanHours || {})
    }
  };
  
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
