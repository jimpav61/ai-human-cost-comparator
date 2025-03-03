
import jsPDF from 'jspdf';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import { JsPDFWithAutoTable, GeneratePDFParams } from './types';
import { addHeader } from './sections/header';
import { addCostSummary } from './sections/costSummary';
import { addBusinessRecommendations } from './sections/recommendations';
import { addAIPlacements } from './sections/aiPlacements';
import { addContactSection } from './sections/contact';

export const generatePDF = (params: GeneratePDFParams) => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  
  // Add the header section (title, contact info, etc.)
  let currentY = addHeader(doc, params);
  
  // Add the cost summary section with the comparison table
  currentY = addCostSummary(doc, currentY, params);
  
  // Add business recommendations section
  currentY = addBusinessRecommendations(doc, currentY, params.businessSuggestions);
  
  // Add AI placement opportunities section
  currentY = addAIPlacements(doc, currentY, params.aiPlacements);
  
  // Add contact information section
  addContactSection(doc, currentY);

  return doc;
};
