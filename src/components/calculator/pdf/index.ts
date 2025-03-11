
import jsPDF from 'jspdf';
import { GeneratePDFParams, JsPDFWithAutoTable, CalculationResults, ensureCalculationResults } from './types';
import { addHeaderSection } from './sections/headerSection';
import { addPlanSection } from './sections/planSection';
import { addCostSummarySection } from './sections/costSummarySection';
import { addCostBreakdownSection } from './sections/costBreakdownSection';
import { addRecommendationsSection } from './sections/recommendationsSection';
import { addAIPlacementsSection } from './sections/aiPlacementsSection';
import { addContactSection } from './sections/contactSection';
import { SharedResults } from '../shared/types';

export const generatePDF = (params: GeneratePDFParams): JsPDFWithAutoTable => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  
  console.log("PDF generation starting with parameters:", params);
  
  // Validate required parameters to ensure we have data
  const validatedParams = {
    ...params,
    companyName: params.companyName || "Your Company",
    contactInfo: params.contactInfo || "Client",
    email: params.email || "client@example.com",
    phoneNumber: params.phoneNumber || "",
    industry: params.industry || "Other",
    employeeCount: params.employeeCount || 5,
    results: ensureCalculationResults(params.results),
    additionalVoiceMinutes: typeof params.additionalVoiceMinutes === 'number' ? params.additionalVoiceMinutes : 0,
    includedVoiceMinutes: typeof params.includedVoiceMinutes === 'number' ? params.includedVoiceMinutes : 600,
    tierName: params.tierName || "Growth Plan",
    aiType: params.aiType || "Text Only"
  };
  
  console.log("Validated PDF parameters:", validatedParams);
  
  // Add header section with contact info
  let currentY = addHeaderSection(
    doc, 
    validatedParams.companyName, 
    validatedParams.contactInfo, 
    validatedParams.email, 
    validatedParams.phoneNumber,
    validatedParams.industry,
    validatedParams.employeeCount
  );

  // Add selected plan details
  currentY = addPlanSection(
    doc, 
    currentY, 
    validatedParams.tierName, 
    validatedParams.aiType,
    validatedParams.results.aiCostMonthly?.setupFee,
    validatedParams.includedVoiceMinutes,
    validatedParams.additionalVoiceMinutes,
    validatedParams.results.basePriceMonthly
  );

  // Add cost summary table
  currentY = addCostSummarySection(doc, currentY, validatedParams.results);

  // Add cost breakdown - pass the entire results object
  currentY = addCostBreakdownSection(doc, currentY, validatedParams.results);

  // Add implementation recommendations
  currentY = addRecommendationsSection(doc, currentY, validatedParams.businessSuggestions);

  // Add AI integration opportunities
  currentY = addAIPlacementsSection(doc, currentY, validatedParams.aiPlacements);

  // Add contact section
  addContactSection(doc, currentY, validatedParams.employeeCount);

  return doc;
};

export * from './types';
