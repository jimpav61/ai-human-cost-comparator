
import jsPDF from 'jspdf';
import type { GeneratePDFParams, JsPDFWithAutoTable } from './types';
import { addHeaderSection } from './sections/headerSection';
import { addPlanSection } from './sections/planSection';
import { addCostSummarySection } from './sections/costSummarySection';
import { addRecommendationsSection } from './sections/recommendationsSection';
import { addAIPlacementsSection } from './sections/aiPlacementsSection';
import { addContactSection } from './sections/contactSection';

export const generatePDF = (params: GeneratePDFParams) => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  
  // Add header section
  let currentY = addHeaderSection(
    doc, 
    params.companyName, 
    params.contactInfo, 
    params.email, 
    params.phoneNumber,
    params.industry,
    params.employeeCount
  );

  // Add plan section if tier name and AI type are provided
  if (params.tierName && params.aiType) {
    currentY = addPlanSection(
      doc, 
      currentY, 
      params.tierName, 
      params.aiType, 
      params.results.aiCostMonthly.setupFee
    );
  }

  // Add cost summary section
  currentY = addCostSummarySection(doc, currentY, params.results);

  // Add business recommendations section
  currentY = addRecommendationsSection(doc, currentY, params.businessSuggestions);

  // Add AI placements section
  currentY = addAIPlacementsSection(doc, currentY, params.aiPlacements);

  // Add contact section
  addContactSection(doc, currentY, params.employeeCount);

  return doc;
};
