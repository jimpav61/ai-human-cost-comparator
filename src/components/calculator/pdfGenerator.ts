import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { CalculationResults } from '@/hooks/useCalculator';
import type { BusinessSuggestion, AIPlacement } from './types';
import { AI_RATES } from '@/constants/pricing';

// Add custom interface to handle the jsPDF extension from autotable
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY?: number;
  };
}

interface GeneratePDFParams {
  contactInfo: string;
  companyName: string;
  email: string;
  phoneNumber: string | null;
  industry?: string;
  employeeCount?: number;
  results: CalculationResults;
  businessSuggestions: BusinessSuggestion[];
  aiPlacements: AIPlacement[];
  tierName?: string;
  aiType?: string;
}

export const generatePDF = (params: GeneratePDFParams) => {
  const doc = new jsPDF() as JsPDFWithAutoTable;
  const reportDate = new Date().toLocaleDateString();

  // Title
  doc.setFontSize(20);
  doc.text("AI Integration Cost Analysis Report", 20, 20);
  
  // Contact Information
  doc.setFontSize(12);
  doc.text(`Generated for: ${params.companyName}`, 20, 35);
  doc.text(`Contact: ${params.contactInfo}`, 20, 42);
  doc.text(`Email: ${params.email}`, 20, 49);
  
  let currentY = 56;
  
  if (params.phoneNumber) {
    doc.text(`Phone: ${params.phoneNumber}`, 20, currentY);
    currentY += 7;
  }
  
  if (params.industry) {
    doc.text(`Industry: ${params.industry}`, 20, currentY);
    currentY += 7;
  }
  
  if (params.employeeCount) {
    doc.text(`Company Size: ${params.employeeCount} employees`, 20, currentY);
    currentY += 7;
  }
  
  doc.text(`Date: ${reportDate}`, 20, currentY);
  currentY += 14;

  // Add selected plan information with voice minutes details
  if (params.tierName && params.aiType) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Selected Plan", 20, currentY);
    currentY += 8;
    
    doc.setFontSize(12);
    const tierKey = params.tierName.toLowerCase().includes('starter') ? 'starter' : 
                   params.tierName.toLowerCase().includes('growth') ? 'growth' : 
                   params.tierName.toLowerCase().includes('premium') ? 'premium' : 'growth';
    
    const includedMinutes = AI_RATES.chatbot[tierKey]?.includedVoiceMinutes || 0;
    const voiceCapability = tierKey === 'starter' ? 'No voice capabilities' : 
                          `Includes ${includedMinutes} free voice minutes per month`;
    
    doc.text(`${params.tierName} (${params.aiType})`, 20, currentY);
    currentY += 7;
    
    // Only show voice capabilities line if not starter plan or if explicitly mentioned
    if (tierKey !== 'starter' || params.aiType.toLowerCase().includes('voice')) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(voiceCapability, 20, currentY);
      currentY += 7;
    }
    
    // Add the one-time setup fee information
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`One-time setup fee: ${formatCurrency(params.results.aiCostMonthly.setupFee || 0)}`, 20, currentY);
    currentY += 12; // Extra spacing
  }

  // Cost Summary
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Cost Summary", 20, currentY);
  
  const costData = [
    ["Current Human Resources Cost", formatCurrency(params.results.humanCostMonthly), formatCurrency(params.results.humanCostMonthly * 12), "N/A"],
    ["ChatSites.ai Solution (Your Cost)", formatCurrency(params.results.aiCostMonthly.total), formatCurrency(params.results.aiCostMonthly.total * 12), formatCurrency(params.results.aiCostMonthly.setupFee)],
    ["Potential Savings", formatCurrency(params.results.monthlySavings), formatCurrency(params.results.yearlySavings), "N/A"]
  ];

  autoTable(doc, {
    startY: currentY + 5,
    head: [["Category", "Monthly Cost", "Annual Cost", "One-Time Setup Fee"]],
    body: costData,
    styles: { fontSize: 11 },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    // Use a more specific styling approach for individual rows
    willDrawCell: function(data) {
      // Highlight the AI Solution row with a green background
      if (data.row.index === 1 && data.section === 'body') {
        data.cell.styles.fillColor = [226, 240, 217];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // Business Recommendations
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
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

  // Final contact section with only email and phone
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
  doc.text("Contact Information:", 20, currentY);
  
  currentY += 10;
  doc.setFontSize(11);
  doc.text("Email: info@chatsites.ai", 25, currentY);
  doc.text("Phone: +1 480 862 0288", 25, currentY + 7);
  doc.text("Website: www.chatsites.ai", 25, currentY + 14);

  return doc;
};
