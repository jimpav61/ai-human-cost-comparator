
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

  let currentY = params.phoneNumber ? 73 : 66;

  // Cost Summary
  doc.setFontSize(14);
  doc.text("Cost Summary", 20, currentY);
  
  const costData = [
    ["Human Resources", formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12)],
    ["AI Solution", formatCurrency(params.results.aiCostMonthly.total), formatCurrency(params.results.aiCostMonthly.total * 12)],
    ["Potential Savings", formatCurrency(params.results.monthlySavings), formatCurrency(params.results.yearlySavings)]
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Category", "Monthly Cost", "Annual Cost"]],
    body: costData,
  });

  // Update currentY based on the table's end position
  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Business Recommendations
  doc.setFontSize(14);
  doc.text("Implementation Recommendations", 20, currentY);
  
  currentY += 10;
  params.businessSuggestions.forEach((suggestion) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(suggestion.title, 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(suggestion.description, 20, currentY + 5);
    
    currentY += 15;
  });

  currentY += 10;

  // AI Placement Opportunities
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("AI Integration Opportunities", 20, currentY);
  
  currentY += 10;
  params.aiPlacements.forEach((placement) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(placement.role, 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    placement.capabilities.forEach((capability, index) => {
      currentY += 5;
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(`• ${capability}`, 25, currentY);
    });
    
    currentY += 10;
  });

  return doc;
};
