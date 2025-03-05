
import jsPDF from 'jspdf';
import { GeneratePDFParams, JsPDFWithAutoTable } from './types';
import { addHeaderSection } from './sections/headerSection';
import { addPlanSection } from './sections/planSection';
import { addCostSummarySection } from './sections/costSummarySection';
import { addCostBreakdownSection } from './sections/costBreakdownSection';
import { addRecommendationsSection } from './sections/recommendationsSection';
import { addAIPlacementsSection } from './sections/aiPlacementsSection';
import { addContactSection } from './sections/contactSection';

export const generatePDF = (params: GeneratePDFParams): JsPDFWithAutoTable => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  
  console.log("PDF generation starting with EXACT same params as frontend:", params);
  
  // Add header section with contact info
  let currentY = addHeaderSection(
    doc, 
    params.companyName, 
    params.contactInfo, 
    params.email, 
    params.phoneNumber,
    params.industry,
    params.employeeCount
  );

  // Add selected plan details if provided
  if (params.tierName && params.aiType) {
    currentY = addPlanSection(
      doc, 
      currentY, 
      params.tierName, 
      params.aiType,
      params.results.aiCostMonthly?.setupFee,
      params.includedVoiceMinutes,
      params.additionalVoiceMinutes
    );
  }

  // Add cost summary table with exact same values as frontend
  currentY = addCostSummarySection(doc, currentY, params.results);

  // Add cost breakdown - with exact same values as frontend
  currentY = addCostBreakdownSection(
    doc, 
    currentY, 
    params.results.basePriceMonthly,
    params.additionalVoiceMinutes,
    params.results.aiCostMonthly?.total
  );

  // Add implementation recommendations
  currentY = addRecommendationsSection(doc, currentY, params.businessSuggestions);

  // Add AI integration opportunities
  currentY = addAIPlacementsSection(doc, currentY, params.aiPlacements);

  // Add contact section
  addContactSection(doc, currentY, params.employeeCount);

  return doc;
};

export * from './types';
