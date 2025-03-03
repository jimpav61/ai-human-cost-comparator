
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

interface GenerateProposalParams {
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

export const generateProposal = (params: GenerateProposalParams) => {
  console.log('Generating proposal with params:', params);
  
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const reportDate = new Date().toLocaleDateString();
  let yPosition = 20;

  // Add document sections
  yPosition = addBranding(doc, yPosition);
  yPosition = addIntroduction(doc, yPosition, params);
  yPosition = addIndustryChallenges(doc, yPosition, params);
  yPosition = addRecommendedSolution(doc, yPosition, params);
  yPosition = addValueProposition(doc, yPosition);
  yPosition = addFinancialImpact(doc, yPosition, params);
  yPosition = addImplementationProcess(doc, yPosition);
  yPosition = addNextSteps(doc, yPosition);
  
  // Add a new page for contact information and additional resources
  doc.addPage();
  yPosition = 20;
  
  yPosition = addAdditionalResources(doc, yPosition);
  yPosition = addContactInformation(doc, yPosition);
  addFooter(doc, params, reportDate);

  return doc;
};
