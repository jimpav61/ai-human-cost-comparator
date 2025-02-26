
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

  currentY = (doc as any).lastAutoTable.finalY + 15;

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

  currentY += 5;

  // AI Placement Opportunities
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("AI Integration Opportunities", 20, currentY);
  
  currentY += 10;
  params.aiPlacements.forEach((placement) => {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(placement.role, 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    placement.capabilities.forEach((capability, index) => {
      doc.text(`• ${capability}`, 25, currentY + 5 + (index * 5));
    });
    
    currentY += 10 + (placement.capabilities.length * 5);
  });

  // Add contact section without creating a new page if there's space
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 15;
  }

  // Final contact section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Get Started with ChatSites.ai", 20, currentY);
  
  currentY += 10;
  doc.setFontSize(12);
  doc.text("Ready to implement these AI solutions?", 20, currentY);
  
  currentY += 10;
  doc.setFontSize(10);
  doc.text("• Custom AI solutions tailored to your business needs", 25, currentY);
  doc.text("• Expert implementation and support", 25, currentY + 7);
  doc.text("• Proven ROI and cost savings", 25, currentY + 14);
  
  currentY += 25;
  doc.setFontSize(12);
  doc.text("Visit: ", 20, currentY);
  doc.setTextColor(0, 102, 204);
  doc.text("https://chatsites.ai", 45, currentY);

  return doc;
};
