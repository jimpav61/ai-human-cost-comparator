
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { BusinessSuggestion, AIPlacement } from './types';

interface GeneratePDFParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  results: CalculationResults;
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
}

export const generatePDF = (params: GeneratePDFParams) => {
  const doc = new jsPDF();
  const reportDate = new Date().toLocaleDateString();

  // Title
  doc.setFontSize(20);
  doc.text("AI Integration Cost Analysis Report", 20, 20);
  
  // Contact Information
  doc.setFontSize(12);
  doc.text(`Generated for: ${params.companyName}`, 20, 35);
  doc.text(`Contact: ${params.contactInfo}`, 20, 42);
  doc.text(`Email: ${params.email}`, 20, 49);
  if (params.phoneNumber) doc.text(`Phone: ${params.phoneNumber}`, 20, 56);
  doc.text(`Date: ${reportDate}`, 20, params.phoneNumber ? 63 : 56);
  
  let finalY = params.phoneNumber ? 73 : 66;

  // Cost Summary
  doc.setFontSize(14);
  doc.text("Cost Summary", 20, finalY);
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [["Category", "Monthly Cost", "Annual Cost"]],
    body: [
      ["Human Resources", formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12)],
      ["AI Solution", formatCurrency(params.results.aiCostMonthly.total), formatCurrency(params.results.aiCostMonthly.total * 12)],
      ["Potential Savings", formatCurrency(params.results.monthlySavings), formatCurrency(params.results.yearlySavings)]
    ],
  });

  finalY = (doc as any).previousAutoTable.finalY + 20;

  // Business Recommendations
  doc.setFontSize(14);
  doc.text("Implementation Recommendations", 20, finalY);
  
  let recommendationY = finalY + 10;
  params.businessSuggestions.forEach((suggestion) => {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(suggestion.title, 20, recommendationY);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(suggestion.description, 20, recommendationY + 5);
    recommendationY += 15;
  });

  finalY = recommendationY + 10;

  // AI Placement Opportunities
  doc.setFontSize(14);
  doc.text("AI Integration Opportunities", 20, finalY);
  
  let placementY = finalY + 10;
  params.aiPlacements.forEach((placement) => {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(placement.role, 20, placementY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    placement.capabilities.forEach((capability, index) => {
      doc.text(`• ${capability}`, 25, placementY + 5 + (index * 5));
    });
    
    placementY += 25;
  });

  return doc;
};
